import { ArrowForwardIcon } from '@/shared/components/Icons';
import { Button } from '@/shared/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/shadcn/ui/dialog';

type PlanChangeType = 'upgrade-to-business' | 'downgrade-to-pro';

type PlanChangeDialogProps = {
  type: PlanChangeType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

const planChangeConfig: Record<
  PlanChangeType,
  {
    title: string;
    description: string;
    confirmText: string;
    fromPrice: string;
    toPrice: string;
  }
> = {
  'upgrade-to-business': {
    title: 'Upgrade to Business',
    description: 'The change will take effect immediately with prorated billing for the current period.',
    confirmText: 'Upgrade to Business',
    fromPrice: '$20',
    toPrice: '$40',
  },
  'downgrade-to-pro': {
    title: 'Downgrade to Pro',
    description: 'The change will take effect immediately with prorated credit applied to your account.',
    confirmText: 'Downgrade to Pro',
    fromPrice: '$40',
    toPrice: '$20',
  },
};

export function PlanChangeDialog({ type, isOpen, onOpenChange, onConfirm, isLoading = false }: PlanChangeDialogProps) {
  const config = planChangeConfig[type];
  const isUpgrade = type === 'upgrade-to-business';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-row items-center justify-between gap-3 bg-muted px-2 py-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Current price</span>
            <span className="font-medium">{config.fromPrice}/user/mo.</span>
          </div>
          <ArrowForwardIcon className="text-muted-foreground opacity-50" />
          <div className="flex flex-col text-right">
            <span className="text-sm text-muted-foreground">New price</span>
            <span className="font-medium">{config.toPrice}/user/mo.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={isLoading} variant={isUpgrade ? 'default' : 'outline'}>
            {config.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
