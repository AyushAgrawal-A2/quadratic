import type { Team } from '@prisma/client';
import { EduStatus, SubscriptionStatus } from '@prisma/client';
import dbClient from '../dbClient';
import { FREE_EDITABLE_FILE_LIMIT, isRunningInTest } from '../env-vars';
import { updateBilling } from '../stripe/stripe';
import logger from '../utils/logger';
import type { DecryptedTeam } from '../utils/teams';

/**
 * Check if a user has educational status that bypasses file limits.
 * Educational users get unlimited file editing, similar to paid plans.
 */
export const isUserEducational = async (userId: number | undefined): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  const user = await dbClient.user.findUnique({
    where: { id: userId },
    select: { eduStatus: true },
  });

  return user?.eduStatus === EduStatus.ENROLLED;
};

export const getIsOnPaidPlan = async (team: Team | DecryptedTeam) => {
  if (isRunningInTest) {
    return team.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;
  }

  const needsBillingSync =
    // If status is INCOMPLETE (checkout in progress, webhook may be delayed), sync with Stripe
    team.stripeSubscriptionStatus === SubscriptionStatus.INCOMPLETE ||
    // If status is INCOMPLETE_EXPIRED (previous attempt failed, user may have retried), sync with Stripe
    team.stripeSubscriptionStatus === SubscriptionStatus.INCOMPLETE_EXPIRED ||
    // If the team is on a paid plan, but the current period has ended, update the billing info
    (team.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE &&
      !!team.stripeCurrentPeriodEnd &&
      team.stripeCurrentPeriodEnd < new Date());

  if (needsBillingSync) {
    try {
      await updateBilling(team);
    } catch (error) {
      logger.error('Failed to sync billing in getIsOnPaidPlan', {
        teamId: team.id,
        stripeCustomerId: team.stripeCustomerId,
        currentStatus: team.stripeSubscriptionStatus,
        error,
      });
    }

    // Re-fetch team from database to get updated status
    const dbTeam = await dbClient.team.findUnique({
      where: {
        id: team.id,
      },
    });

    return dbTeam?.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;
  }

  return team.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;
};

/**
 * Get the maximum number of editable files for free teams.
 */
export const getFreeEditableFileLimit = (): number => {
  return FREE_EDITABLE_FILE_LIMIT;
};

/**
 * Internal helper to get editable file IDs.
 * @param hasUnlimitedAccess - true if the user has unlimited file access (paid plan or educational status)
 */
const getEditableFileIdsInternal = async (
  team: Team | DecryptedTeam,
  hasUnlimitedAccess: boolean
): Promise<{ editableFileIds: number[]; allFileIds?: number[] }> => {
  if (hasUnlimitedAccess) {
    // Unlimited access users can edit all files - return all file IDs
    const allFiles = await dbClient.file.findMany({
      where: {
        ownerTeamId: team.id,
        deleted: false,
      },
      select: { id: true },
    });
    const fileIds = allFiles.map((f) => f.id);
    return { editableFileIds: fileIds, allFileIds: fileIds };
  }

  // Limited access: return only the N most recently created file IDs
  const limit = getFreeEditableFileLimit();
  const editableFiles = await dbClient.file.findMany({
    where: {
      ownerTeamId: team.id,
      deleted: false,
    },
    orderBy: {
      createdDate: 'desc',
    },
    take: limit,
    select: { id: true },
  });

  return { editableFileIds: editableFiles.map((f) => f.id) };
};

/**
 * Check if a specific file requires upgrade to edit due to billing limits (soft file limit).
 * Returns true if the file is NOT in the top N most recently created files for free teams.
 *
 * IMPORTANT: This is distinct from permission-based "View only" access:
 * - "View only" (permission-based): User doesn't have FILE_EDIT permission due to sharing settings
 * - "Upgrade to edit" (billing-based): User would have FILE_EDIT permission, but it's restricted
 *   because the team is on a free plan and this file exceeds the editable file limit
 *
 * When this returns true, the UI should show "Upgrade to edit" messaging rather than "View only"
 *
 * @param team - The team that owns the file
 * @param fileId - The file ID to check
 * @param userId - Optional user ID; if provided and user has educational status, returns false
 */
export const requiresUpgradeToEdit = async (
  team: Team | DecryptedTeam,
  fileId: number,
  userId?: number
): Promise<boolean> => {
  if (await getIsOnPaidPlan(team)) {
    return false;
  }

  // Educational users bypass file limits
  if (await isUserEducational(userId)) {
    return false;
  }

  const { editableFileIds } = await getEditableFileIdsInternal(team, false);
  return !editableFileIds.includes(fileId);
};

/**
 * Get file limit information for a team.
 * Returns whether the team is over the editable file limit and related counts.
 * @param team - The team to check
 * @param isPaidPlan - Optional: pass in the result of getIsOnPaidPlan() to avoid redundant lookup
 * @param userId - Optional user ID; if provided and user has educational status, treated as unlimited
 * @param isEdu - Optional: pass in the result of isUserEducational() to avoid redundant lookup
 */
export const getFileLimitInfo = async (
  team: Team | DecryptedTeam,
  isPaidPlan?: boolean,
  userId?: number,
  isEdu?: boolean
): Promise<{
  isOverLimit: boolean;
  totalFiles: number;
  maxEditableFiles: number;
  editableFileIds: number[];
}> => {
  const isPaid = isPaidPlan ?? (await getIsOnPaidPlan(team));

  // Educational users get treated like paid plan users for file limits
  const isEducational = isEdu ?? (await isUserEducational(userId));
  const hasUnlimitedFiles = isPaid || isEducational;

  if (hasUnlimitedFiles) {
    // Paid teams and educational users have no limit - single query to get all file IDs
    const { editableFileIds, allFileIds } = await getEditableFileIdsInternal(team, true);
    return {
      isOverLimit: false,
      totalFiles: allFileIds!.length,
      maxEditableFiles: Infinity,
      editableFileIds,
    };
  }

  // Free teams: need total count and editable file IDs
  // Run both queries in parallel to minimize latency
  const [totalFiles, { editableFileIds }] = await Promise.all([
    dbClient.file.count({
      where: {
        ownerTeamId: team.id,
        deleted: false,
      },
    }),
    getEditableFileIdsInternal(team, false),
  ]);

  const maxEditableFiles = getFreeEditableFileLimit();

  return {
    isOverLimit: totalFiles > maxEditableFiles,
    totalFiles,
    maxEditableFiles,
    editableFileIds,
  };
};
