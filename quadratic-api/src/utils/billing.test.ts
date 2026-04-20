import type { Team } from '@prisma/client';
import { EduStatus } from '@prisma/client';
import dbClient from '../dbClient';
import { clearDb, createFile, createTeam, createUser, upgradeTeamToPro } from '../tests/testDataGenerator';
import { getFileLimitInfo, getFreeEditableFileLimit, isUserEducational, requiresUpgradeToEdit } from './billing';
import type { DecryptedTeam } from './teams';

// Mock FREE_EDITABLE_FILE_LIMIT for testing
jest.mock('../env-vars', () => ({
  ...jest.requireActual('../env-vars'),
  FREE_EDITABLE_FILE_LIMIT: 5,
}));

let userId: number;

beforeEach(async () => {
  userId = (
    await createUser({
      auth0Id: 'testUser',
    })
  ).id;
});

afterEach(clearDb);

describe('getFreeEditableFileLimit', () => {
  it('returns the configured limit', () => {
    expect(getFreeEditableFileLimit()).toBe(5);
  });
});

describe('isUserEducational', () => {
  it('returns true for users with ENROLLED status', async () => {
    const eduUser = await createUser({
      auth0Id: 'eduUser',
      eduStatus: EduStatus.ENROLLED,
    });
    expect(await isUserEducational(eduUser.id)).toBe(true);
  });

  it('returns false for users with INELIGIBLE status', async () => {
    const ineligibleUser = await createUser({
      auth0Id: 'ineligibleUser',
      eduStatus: EduStatus.INELIGIBLE,
    });
    expect(await isUserEducational(ineligibleUser.id)).toBe(false);
  });

  it('returns false for users with no eduStatus', async () => {
    expect(await isUserEducational(userId)).toBe(false);
  });

  it('returns false for undefined userId', async () => {
    expect(await isUserEducational(undefined)).toBe(false);
  });
});

describe('requiresUpgradeToEdit', () => {
  it('returns false for all files on paid teams', async () => {
    let team: DecryptedTeam | Team | null = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000010' },
      users: [{ userId, role: 'OWNER' }],
    });

    await upgradeTeamToPro(team.id);
    team = await dbClient.team.findUnique({ where: { id: team.id } });
    if (!team) throw new Error('Team not found');

    // Create 5 files
    const files = [];
    for (let i = 0; i < 5; i++) {
      const file = await createFile({
        data: {
          uuid: `00000000-0000-0000-0010-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
      files.push(file);
    }

    // All files should be editable
    for (const file of files) {
      expect(await requiresUpgradeToEdit(team, file.id)).toBe(false);
    }
  });

  it('returns true for older files on free teams beyond the limit', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000011' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 7 files with staggered creation dates (more than limit of 5)
    const files = [];
    for (let i = 0; i < 7; i++) {
      const file = await createFile({
        data: {
          uuid: `00000000-0000-0000-0011-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
          createdDate: new Date(Date.now() + i * 1000),
        },
      });
      files.push(file);
    }

    // Oldest 2 files (files[0], files[1]) should be restricted
    expect(await requiresUpgradeToEdit(team, files[0].id)).toBe(true);
    expect(await requiresUpgradeToEdit(team, files[1].id)).toBe(true);

    // Newest 5 files (files[2], files[3], files[4], files[5], files[6]) should NOT be restricted
    expect(await requiresUpgradeToEdit(team, files[2].id)).toBe(false);
    expect(await requiresUpgradeToEdit(team, files[3].id)).toBe(false);
    expect(await requiresUpgradeToEdit(team, files[4].id)).toBe(false);
    expect(await requiresUpgradeToEdit(team, files[5].id)).toBe(false);
    expect(await requiresUpgradeToEdit(team, files[6].id)).toBe(false);
  });

  it('returns false for all files when under the limit', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000012' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create only 4 files (under limit of 5)
    const files = [];
    for (let i = 0; i < 4; i++) {
      const file = await createFile({
        data: {
          uuid: `00000000-0000-0000-0012-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
      files.push(file);
    }

    // All files should be editable
    for (const file of files) {
      expect(await requiresUpgradeToEdit(team, file.id)).toBe(false);
    }
  });

  it('returns false for all files when user has educational status', async () => {
    const eduUser = await createUser({
      auth0Id: 'eduUserForRequiresUpgrade',
      eduStatus: EduStatus.ENROLLED,
    });
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000013' },
      users: [{ userId: eduUser.id, role: 'OWNER' }],
    });

    // Create 7 files (over limit of 5)
    const files = [];
    for (let i = 0; i < 7; i++) {
      const file = await createFile({
        data: {
          uuid: `00000000-0000-0000-0013-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: eduUser.id,
          ownerTeamId: team.id,
          createdDate: new Date(Date.now() + i * 1000),
        },
      });
      files.push(file);
    }

    // All files should be editable for educational users
    for (const file of files) {
      expect(await requiresUpgradeToEdit(team, file.id, eduUser.id)).toBe(false);
    }
  });

  it('still restricts files for non-educational users even if called with userId', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000014' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 7 files (over limit of 5)
    const files = [];
    for (let i = 0; i < 7; i++) {
      const file = await createFile({
        data: {
          uuid: `00000000-0000-0000-0014-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
          createdDate: new Date(Date.now() + i * 1000),
        },
      });
      files.push(file);
    }

    // Oldest 2 files should still be restricted for non-edu users
    expect(await requiresUpgradeToEdit(team, files[0].id, userId)).toBe(true);
    expect(await requiresUpgradeToEdit(team, files[1].id, userId)).toBe(true);
  });
});

describe('getFileLimitInfo', () => {
  it('returns correct info for free team under limit', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000020' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 4 files (under limit of 5)
    for (let i = 0; i < 4; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0020-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
    }

    const info = await getFileLimitInfo(team);
    expect(info.isOverLimit).toBe(false);
    expect(info.totalFiles).toBe(4);
    expect(info.maxEditableFiles).toBe(5);
    expect(info.editableFileIds).toHaveLength(4);
  });

  it('returns correct info for free team at limit', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000021' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create exactly 5 files (at limit)
    for (let i = 0; i < 5; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0021-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
    }

    const info = await getFileLimitInfo(team);
    expect(info.isOverLimit).toBe(false); // At limit (not over) - all 5 files are editable
    expect(info.totalFiles).toBe(5);
    expect(info.maxEditableFiles).toBe(5);
    expect(info.editableFileIds).toHaveLength(5);
  });

  it('returns correct info for free team over limit', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000022' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 7 files (over limit of 5)
    for (let i = 0; i < 7; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0022-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
    }

    const info = await getFileLimitInfo(team);
    expect(info.isOverLimit).toBe(true);
    expect(info.totalFiles).toBe(7);
    expect(info.maxEditableFiles).toBe(5);
    expect(info.editableFileIds).toHaveLength(5); // Only 5 are editable
  });

  it('returns correct info for paid team (no limit)', async () => {
    let team: DecryptedTeam | Team | null = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000023' },
      users: [{ userId, role: 'OWNER' }],
    });

    await upgradeTeamToPro(team.id);
    team = await dbClient.team.findUnique({ where: { id: team.id } });
    if (!team) throw new Error('Team not found');

    // Create 10 files
    for (let i = 0; i < 10; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0023-0000000000${i.toString().padStart(2, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
    }

    const info = await getFileLimitInfo(team);
    expect(info.isOverLimit).toBe(false);
    expect(info.totalFiles).toBe(10);
    expect(info.maxEditableFiles).toBe(Infinity);
    expect(info.editableFileIds).toHaveLength(10); // All files editable
  });

  it('does not count deleted files', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000024' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 7 files, delete 3
    for (let i = 0; i < 7; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0024-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
          deleted: i < 3, // First 3 are deleted
          deletedDate: i < 3 ? new Date() : null,
        },
      });
    }

    const info = await getFileLimitInfo(team);
    expect(info.totalFiles).toBe(4); // Only 4 non-deleted files
    expect(info.isOverLimit).toBe(false); // 4 < 5, so under limit
    expect(info.editableFileIds).toHaveLength(4);
  });

  it('treats educational users like paid plans (no limit)', async () => {
    const eduUser = await createUser({
      auth0Id: 'eduUserForFileLimitInfo',
      eduStatus: EduStatus.ENROLLED,
    });
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000025' },
      users: [{ userId: eduUser.id, role: 'OWNER' }],
    });

    // Create 10 files (way over limit of 5)
    for (let i = 0; i < 10; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0025-0000000000${i.toString().padStart(2, '0')}`,
          name: `File ${i}`,
          creatorUserId: eduUser.id,
          ownerTeamId: team.id,
        },
      });
    }

    const info = await getFileLimitInfo(team, false, eduUser.id);
    expect(info.isOverLimit).toBe(false);
    expect(info.totalFiles).toBe(10);
    expect(info.maxEditableFiles).toBe(Infinity);
    expect(info.editableFileIds).toHaveLength(10); // All files editable
  });

  it('still applies limits for non-educational users', async () => {
    const team = await createTeam({
      team: { uuid: '00000000-0000-0000-0000-000000000026' },
      users: [{ userId, role: 'OWNER' }],
    });

    // Create 7 files (over limit of 5)
    for (let i = 0; i < 7; i++) {
      await createFile({
        data: {
          uuid: `00000000-0000-0000-0026-000000000${i.toString().padStart(3, '0')}`,
          name: `File ${i}`,
          creatorUserId: userId,
          ownerTeamId: team.id,
        },
      });
    }

    // When called with non-edu userId, should still enforce limits
    const info = await getFileLimitInfo(team, false, userId);
    expect(info.isOverLimit).toBe(true);
    expect(info.totalFiles).toBe(7);
    expect(info.maxEditableFiles).toBe(5);
    expect(info.editableFileIds).toHaveLength(5); // Only 5 editable
  });
});
