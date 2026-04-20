import { overageDialogAtom } from '@/shared/atom/overageDialogAtom';
import { teamBillingAtom } from '@/shared/atom/teamBillingAtom';
import { OverageSettingsControls } from '@/shared/components/OverageSettingsControls';
import { useOverageSettings } from '@/shared/hooks/useOverageSettings';
import { useTeamData } from '@/shared/hooks/useTeamData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/shadcn/ui/dialog';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';

export function OverageDialog() {
  const [state, setState] = useAtom(overageDialogAtom);
  const { teamData } = useTeamData();
  const { planType } = useAtomValue(teamBillingAtom);

  const team = teamData?.activeTeam?.team;
  const teamPermissions = teamData?.activeTeam?.userMakingRequest?.teamPermissions;
  const canManageAIOverage = useMemo(() => teamPermissions?.includes('TEAM_EDIT') ?? false, [teamPermissions]);
  const isBusiness = planType === 'BUSINESS';

  const overage = useOverageSettings({
    teamUuid: team?.uuid,
    enabled: state.open && isBusiness,
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setState({ open: false });
      }
    },
    [setState]
  );

  if (!isBusiness || !team) return null;

  return (
    <Dialog open={state.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage on-demand usage</DialogTitle>
          <DialogDescription>Control AI spend beyond the included monthly limits.</DialogDescription>
        </DialogHeader>

        <div className="relative flex flex-col gap-2">
          <div className="flex flex-col gap-4 pt-2">
            {canManageAIOverage ? (
              <OverageSettingsControls
                canManageAIOverage={canManageAIOverage}
                idPrefix="overage-dialog"
                overage={overage}
              />
            ) : (
              <p className="text-sm">
                Ask a team editor or owner to enable on-demand usage, or view usage details in team settings.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
