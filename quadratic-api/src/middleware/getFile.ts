import dbClient from '../dbClient';
import { ApiError } from '../utils/ApiError';
import { getFilePermissions } from '../utils/permissions';

/**
 * Most of the time, `userId` will be defined because the user will be logged in.
 * However, in the case of a publicly-shared file, anonymous users can request
 * a file and we don't know who they are.
 */
export async function getFile<T extends number | undefined>({ uuid, userId }: { uuid: string; userId: T }) {
  const file = await dbClient.file.findUnique({
    where: {
      uuid,
    },
    include: {
      ownerTeam: {
        include: {
          UserTeamRole: {
            where: {
              userId: userId,
            },
          },
        },
      },
      UserFileRole: {
        where: {
          userId,
        },
      },
    },
  });

  if (file === null) {
    throw new ApiError(404, 'File not found');
  }

  if (file.deleted) {
    throw new ApiError(400, 'File has been deleted');
  }

  const isFileOwner = !file.ownerTeamId && file.ownerUserId === userId;
  const teamRole = undefined; //file.ownerTeam && file.ownerTeam.UserTeamRole[0] ? file.ownerTeam.UserTeamRole[0].role : undefined;
  const fileRole = undefined; //file.UserFileRole[0] ? file.UserFileRole[0].role : undefined;

  const filePermissions = getFilePermissions({
    fileRole,
    teamRole,
    publicLinkAccess: file.publicLinkAccess,
    isFileOwner,
  });

  if (!filePermissions.includes('FILE_VIEW')) {
    throw new ApiError(403, 'Permission denied');
  }

  return {
    file,
    userMakingRequest: {
      filePermissions,
      fileRole,
      teamRole,
      id: userId,
      isFileOwner,
    },
  };
}
