import { CancellationDialog } from '@/components/CancellationDialog';
import { apiClient } from '@/shared/api/apiClient';
import { billingConfigAtom, fetchBillingConfig } from '@/shared/atom/billingConfigAtom';
import { showUpgradeDialogAtom } from '@/shared/atom/showUpgradeDialogAtom';
import { teamBillingAtom, updateTeamBilling } from '@/shared/atom/teamBillingAtom';
import { useGlobalSnackbar } from '@/shared/components/GlobalSnackbarProvider';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/shadcn/ui/button';
import { trackEvent } from '@/shared/utils/analyticsEvents';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { PlanCard } from './PlanCard';
import { PlanChangeDialog } from './PlanChangeDialog';

type BillingPlansProps = {
  canManageBilling: boolean;
  eventSource: string;
  teamUuid: string;
};

export const BillingPlans = ({ canManageBilling, eventSource, teamUuid }: BillingPlansProps) => {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const setShowUpgradeDialog = useSetAtom(showUpgradeDialogAtom);
  const { addGlobalSnackbar } = useGlobalSnackbar();
  const { planType, cancelAtPeriodEnd, currentPeriodEnd } = useAtomValue(teamBillingAtom);
  const billingConfig = useAtomValue(billingConfigAtom);
  const isNavigating = navigation.state !== 'idle';
  const [isUpgradingToBusiness, setIsUpgradingToBusiness] = useState(false);
  const [isUpgradingToPro, setIsUpgradingToPro] = useState(false);
  const [isDowngradingToPro, setIsDowngradingToPro] = useState(false);
  const [showUpgradeToBusinessDialog, setShowUpgradeToBusinessDialog] = useState(false);
  const [showDowngradeToProDialog, setShowDowngradeToProDialog] = useState(false);
  const isBusy = isNavigating || isUpgradingToBusiness || isDowngradingToPro;

  useEffect(() => {
    fetchBillingConfig();
  }, []);

  // Get current path to return to after checkout
  const returnTo = location.pathname + location.search;

  const isFree = planType === 'FREE';
  const isPro = planType === 'PRO';
  const isBusiness = planType === 'BUSINESS';

  const refreshBillingData = async () => {
    try {
      const freshData = await apiClient.teams.get(teamUuid, { updateBilling: true });
      if (freshData.billing) {
        updateTeamBilling({
          isOnPaidPlan: freshData.billing.status === 'ACTIVE',
          planType: freshData.billing.planType ?? 'FREE',
          cancelAtPeriodEnd: freshData.billing.cancelAtPeriodEnd ?? false,
          currentPeriodEnd: freshData.billing.currentPeriodEnd ?? null,
        });
      }
    } catch (error) {
      console.error('Failed to refresh billing data:', error);
    }
  };

  const handleUpgradeToBusinessClick = () => {
    trackEvent('[Billing].upgradeToBusinessClicked', { eventSource });

    if (isPro) {
      // Pro→Business: show confirmation dialog first
      setShowUpgradeToBusinessDialog(true);
    } else {
      // Free→Business: needs Stripe checkout, use the navigate/redirect flow
      navigate(ROUTES.TEAM_BILLING_SUBSCRIBE(teamUuid, { returnTo, plan: 'business' }));
    }
  };

  const handleConfirmUpgradeToBusiness = async () => {
    setIsUpgradingToBusiness(true);
    try {
      const redirectUrl = `${window.location.origin}${returnTo}`;
      await apiClient.teams.billing.getCheckoutSessionUrl(teamUuid, redirectUrl, redirectUrl, 'business');
      trackEvent('[Billing].upgradeSuccess', { team_uuid: teamUuid });
      // Optimistically update UI, then fetch fresh data in background
      updateTeamBilling({ isOnPaidPlan: true, planType: 'BUSINESS', cancelAtPeriodEnd: false, currentPeriodEnd: null });
      setShowUpgradeDialog({ open: false, eventSource: null });
      setShowUpgradeToBusinessDialog(false);
      addGlobalSnackbar('Your plan has been upgraded to Business!', { severity: 'success' });
      // Fetch fresh billing data to get updated currentPeriodEnd
      refreshBillingData();
    } catch (error) {
      console.error('Failed to upgrade to Business:', error);
      const message = error instanceof Error ? error.message : 'Failed to upgrade to Business. Please try again.';
      addGlobalSnackbar(message, { severity: 'error' });
    } finally {
      setIsUpgradingToBusiness(false);
    }
  };

  const handleDowngradeToProClick = () => {
    trackEvent('[Billing].downgradeToProClicked', { eventSource });
    setShowDowngradeToProDialog(true);
  };

  const handleConfirmDowngradeToPro = async () => {
    setIsDowngradingToPro(true);
    try {
      const redirectUrl = `${window.location.origin}${returnTo}`;
      await apiClient.teams.billing.getCheckoutSessionUrl(teamUuid, redirectUrl, redirectUrl, 'pro');
      trackEvent('[Billing].downgradeSuccess', { team_uuid: teamUuid });
      // Optimistically update UI, then fetch fresh data in background
      updateTeamBilling({ isOnPaidPlan: true, planType: 'PRO', cancelAtPeriodEnd: false, currentPeriodEnd: null });
      setShowDowngradeToProDialog(false);
      addGlobalSnackbar('Your plan has been downgraded to Pro.', { severity: 'success' });
      // Fetch fresh billing data to get updated currentPeriodEnd
      refreshBillingData();
    } catch (error) {
      console.error('Failed to downgrade to Pro:', error);
      const message = error instanceof Error ? error.message : 'Failed to downgrade to Pro. Please try again.';
      addGlobalSnackbar(message, { severity: 'error' });
    } finally {
      setIsDowngradingToPro(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PlanCard
        plan="personal"
        isCurrentPlan={isFree}
        aiIncludedUsage={billingConfig.isLoaded ? billingConfig.freeAiMessageLimit : undefined}
      >
        {(isPro || isBusiness) && (
          <CancellationDialog
            teamUuid={teamUuid}
            trigger={
              <Button
                disabled={!canManageBilling}
                variant="outline"
                className="mt-4 w-full"
                onClick={() => {
                  trackEvent('[Billing].downgradeToFreeClicked', { eventSource });
                }}
                data-testid="billing-downgrade-to-free-button"
              >
                Downgrade
              </Button>
            }
          />
        )}
        {!canManageBilling && (isPro || isBusiness) && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Only the team owner can edit billing info.
            <br />
            <Link
              to={ROUTES.TEAM_MEMBERS(teamUuid)}
              className="underline"
              onClick={() => setShowUpgradeDialog({ open: false, eventSource: null })}
            >
              View team members
            </Link>
          </p>
        )}
      </PlanCard>

      <PlanCard
        plan="pro"
        isCurrentPlan={isPro}
        aiIncludedUsage={billingConfig.isLoaded ? billingConfig.proAiAllowance : undefined}
        cancelAtPeriodEnd={isPro ? cancelAtPeriodEnd : false}
        currentPeriodEnd={isPro ? currentPeriodEnd : null}
      >
        {isFree ? (
          <Button
            disabled={!canManageBilling || isBusy}
            onClick={() => {
              setIsUpgradingToPro(true);
              trackEvent('[Billing].upgradeToProClicked', { eventSource });
              navigate(ROUTES.TEAM_BILLING_SUBSCRIBE(teamUuid, { returnTo }));
            }}
            className="mt-4 w-full"
            data-testid="billing-upgrade-to-pro-button"
            loading={isUpgradingToPro && isNavigating}
          >
            Upgrade
          </Button>
        ) : isPro ? (
          <div className="mt-4">
            <Button
              disabled={!canManageBilling}
              variant="secondary"
              className="w-full"
              onClick={() => {
                trackEvent('[Billing].manageBillingClicked', { eventSource });
                navigate(ROUTES.TEAM_BILLING_MANAGE(teamUuid));
              }}
            >
              Manage subscription
            </Button>
          </div>
        ) : (
          // Business plan - Pro is a lower tier, show downgrade button
          <div className="mt-4">
            <Button
              disabled={!canManageBilling || isBusy}
              variant="outline"
              className="w-full"
              onClick={handleDowngradeToProClick}
              data-testid="billing-downgrade-to-pro-button"
              loading={isDowngradingToPro}
            >
              Downgrade
            </Button>
          </div>
        )}
        {!canManageBilling && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Only the team owner can edit billing info.
            <br />
            <Link
              to={ROUTES.TEAM_MEMBERS(teamUuid)}
              className="underline"
              onClick={() => setShowUpgradeDialog({ open: false, eventSource: null })}
            >
              View team members
            </Link>
          </p>
        )}
      </PlanCard>

      <PlanCard
        plan="business"
        isCurrentPlan={isBusiness}
        aiIncludedUsage={billingConfig.isLoaded ? billingConfig.businessAiAllowance : undefined}
        cancelAtPeriodEnd={isBusiness ? cancelAtPeriodEnd : false}
        currentPeriodEnd={isBusiness ? currentPeriodEnd : null}
      >
        {isFree || isPro ? (
          <Button
            disabled={!canManageBilling || isBusy}
            onClick={handleUpgradeToBusinessClick}
            className="mt-4 w-full"
            data-testid="billing-upgrade-to-business-button"
            loading={isUpgradingToBusiness}
          >
            Upgrade
          </Button>
        ) : (
          <div className="mt-4">
            <Button
              disabled={!canManageBilling}
              variant="secondary"
              className="w-full"
              onClick={() => {
                trackEvent('[Billing].manageBillingClicked', { eventSource });
                navigate(ROUTES.TEAM_BILLING_MANAGE(teamUuid));
              }}
            >
              Manage subscription
            </Button>
          </div>
        )}
        {!canManageBilling && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Only the team owner can edit billing info.
            <br />
            <Link
              to={ROUTES.TEAM_MEMBERS(teamUuid)}
              className="underline"
              onClick={() => setShowUpgradeDialog({ open: false, eventSource: null })}
            >
              View team members
            </Link>
          </p>
        )}
      </PlanCard>

      <PlanChangeDialog
        type="upgrade-to-business"
        isOpen={showUpgradeToBusinessDialog}
        onOpenChange={setShowUpgradeToBusinessDialog}
        onConfirm={handleConfirmUpgradeToBusiness}
        isLoading={isUpgradingToBusiness}
      />

      <PlanChangeDialog
        type="downgrade-to-pro"
        isOpen={showDowngradeToProDialog}
        onOpenChange={setShowDowngradeToProDialog}
        onConfirm={handleConfirmDowngradeToPro}
        isLoading={isDowngradingToPro}
      />
    </div>
  );
};
