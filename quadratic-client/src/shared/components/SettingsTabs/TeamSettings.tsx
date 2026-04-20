import { getActionUpdateTeam } from '@/routes/teams.$teamUuid';
import { apiClient } from '@/shared/api/apiClient';
import { updateTeamBilling } from '@/shared/atom/teamBillingAtom';
import { BillingPlans } from '@/shared/components/billing/BillingPlans';
import { useGlobalSnackbar } from '@/shared/components/GlobalSnackbarProvider';
import { ExternalLinkIcon } from '@/shared/components/Icons';
import { ROUTES } from '@/shared/constants/routes';
import { PRICING_URL } from '@/shared/constants/urls';
import { useTeamData } from '@/shared/hooks/useTeamData';
import { Button } from '@/shared/shadcn/ui/button';
import { Input } from '@/shared/shadcn/ui/input';
import { Label } from '@/shared/shadcn/ui/label';
import { Separator } from '@/shared/shadcn/ui/separator';
import { trackEvent } from '@/shared/utils/analyticsEvents';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher, useSubmit } from 'react-router';
import { BusinessPlanSettings } from './BusinessPlanSettings';
import { TeamAIUsage } from './TeamAIUsage';

interface TeamSettingsProps {
  highlightOverage?: boolean;
}

export function TeamSettings({ highlightOverage }: TeamSettingsProps) {
  const { teamData } = useTeamData();
  const submit = useSubmit();
  const fetcher = useFetcher({ key: 'update-team' });
  const { addGlobalSnackbar } = useGlobalSnackbar();

  const activeTeam = teamData?.activeTeam;
  const team = activeTeam?.team;
  const teamPermissions = activeTeam?.userMakingRequest?.teamPermissions;
  const billing = activeTeam?.billing;
  const users = activeTeam?.users;

  const [value, setValue] = useState<string>(team?.name ?? '');
  const disabled = useMemo(
    () => value === '' || value === team?.name || fetcher.state !== 'idle',
    [fetcher.state, team?.name, value]
  );

  // Background sync billing data with Stripe when settings component loads
  useEffect(() => {
    if (!team?.uuid) return;

    let isCancelled = false;

    const syncBilling = async () => {
      try {
        const freshData = await apiClient.teams.get(team.uuid, { updateBilling: true });
        if (!isCancelled && freshData.billing) {
          updateTeamBilling({
            isOnPaidPlan: freshData.billing.status === 'ACTIVE',
            planType: freshData.billing.planType ?? 'FREE',
            cancelAtPeriodEnd: freshData.billing.cancelAtPeriodEnd ?? false,
            currentPeriodEnd: freshData.billing.currentPeriodEnd ?? null,
          });
        }
      } catch (error) {
        console.error('Failed to sync billing data:', error);
      }
    };

    syncBilling();

    return () => {
      isCancelled = true;
    };
  }, [team?.uuid]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (disabled || !team) {
        return;
      }

      trackEvent('[Settings].teamNameSaved', {
        team_uuid: team.uuid,
        new_name: value,
      });

      const data = getActionUpdateTeam({ name: value });
      submit(data, {
        method: 'POST',
        action: ROUTES.TEAM(team.uuid),
        encType: 'application/json',
        fetcherKey: `update-team`,
        navigate: false,
      });
    },
    [disabled, submit, team, value]
  );

  // If for some reason it failed, display an error
  useEffect(() => {
    if (fetcher.data && fetcher.data.ok === false) {
      addGlobalSnackbar('Failed to save. Try again later.', { severity: 'error' });
    }
  }, [fetcher.data, addGlobalSnackbar]);

  const canManageBilling = useMemo(() => teamPermissions?.includes('TEAM_MANAGE') ?? false, [teamPermissions]);

  if (!activeTeam || !team || !teamPermissions || !billing || !users) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-normal text-muted-foreground">Loading team settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // If you don't have permission, show a message
  if (!teamPermissions.includes('TEAM_EDIT')) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-normal text-muted-foreground">
              You don't have permission to edit team settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Name Section */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-normal text-muted-foreground">Manage your team settings</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team-name">Name</Label>
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <Input id="team-name" value={value} onChange={(e) => setValue(e.target.value)} className="max-w-md" />
            <Button type="submit" disabled={disabled} variant="secondary">
              Save
            </Button>
          </form>
        </div>
      </div>

      <Separator />

      {/* Billing Section */}
      <div className="space-y-4">
        <div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Billing</h3>
          </div>
          <div className="flex flex-col gap-4">
            {/* Plan Comparison */}
            <BillingPlans canManageBilling={canManageBilling} teamUuid={team.uuid} eventSource="SettingsDialog" />

            {/* Business Plan Settings (on-demand usage and spending limit) */}
            <BusinessPlanSettings highlight={highlightOverage} />

            {/* AI Usage */}
            <TeamAIUsage />

            <p className="pt-2 text-sm text-muted-foreground">
              Learn more on our{' '}
              <a href={PRICING_URL} target="_blank" rel="noreferrer" className="underline hover:text-primary">
                pricing page
                <ExternalLinkIcon className="relative top-1 ml-0.5 !text-sm" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
