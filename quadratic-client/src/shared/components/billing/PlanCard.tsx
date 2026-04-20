import { VITE_MAX_EDITABLE_FILES } from '@/env-vars';
import { Badge } from '@/shared/shadcn/ui/badge';
import { cn } from '@/shared/shadcn/utils';
import { type ReactNode } from 'react';

const DASH = '\u2014';

type Plan = 'personal' | 'pro' | 'business';

const planConfig: Record<
  Plan,
  {
    title: string;
    price: string;
    formatAiIncludedUsage: (value: number) => string;
    aiOnDemandUsage: string;
    connections: string;
    files: string;
    additionalAiModels: string;
    additionalPrivacyControls: string;
  }
> = {
  personal: {
    title: 'Personal',
    price: 'Free',
    formatAiIncludedUsage: (n) => `${n} prompts/user/mo.`,
    aiOnDemandUsage: DASH,
    connections: 'Limited',
    files: `${VITE_MAX_EDITABLE_FILES} editable files`,
    additionalAiModels: DASH,
    additionalPrivacyControls: DASH,
  },
  pro: {
    title: 'Pro',
    price: '$20/user/mo.',
    formatAiIncludedUsage: (n) => `$${n}/user/mo.`,
    aiOnDemandUsage: DASH,
    connections: 'Unlimited',
    files: 'Unlimited',
    additionalAiModels: 'Included',
    additionalPrivacyControls: 'Included',
  },
  business: {
    title: 'Business',
    price: '$40/user/mo.',
    formatAiIncludedUsage: (n) => `$${n}/user/mo.`,
    aiOnDemandUsage: 'Available',
    connections: 'Unlimited',
    files: 'Unlimited',
    additionalAiModels: 'Included',
    additionalPrivacyControls: 'Included',
  },
};

const formatPeriodEndDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
};

export const PlanCard = ({
  plan,
  aiIncludedUsage,
  isCurrentPlan,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  children,
}: {
  plan: Plan;
  aiIncludedUsage?: number | null;
  isCurrentPlan?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  children?: ReactNode;
}) => {
  const config = planConfig[plan];

  const rows: [string, string][] = [
    ['AI included usage', aiIncludedUsage != null ? config.formatAiIncludedUsage(aiIncludedUsage) : DASH],
    ['AI on-demand usage', config.aiOnDemandUsage],
    ['Connections', config.connections],
    ['Files', config.files],
    ['Additional AI models', config.additionalAiModels],
    ['Additional privacy controls', config.additionalPrivacyControls],
  ];

  const formattedEndDate = formatPeriodEndDate(currentPeriodEnd ?? null);
  const showCancellationInfo = isCurrentPlan && cancelAtPeriodEnd && formattedEndDate;

  return (
    <div
      className={cn(
        'relative flex flex-grow flex-col rounded border p-4',
        isCurrentPlan ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.3)]' : 'border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{config.title}</h3>
        <span className="text-lg font-semibold">{config.price}</span>
      </div>

      <div className="relative mb-4 border-b border-border pb-4">
        {isCurrentPlan && (
          <Badge className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap" variant="secondary">
            {showCancellationInfo ? `Active until ${formattedEndDate}` : 'Active'}
          </Badge>
        )}
      </div>

      <div className="mt-1 flex flex-grow flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span>{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">{children}</div>
    </div>
  );
};
