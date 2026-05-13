import type { PrescriptionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const labels: Record<PrescriptionStatus, string> = {
  pending: 'Pendiente',
  consumed: 'Consumida',
};

const styles: Record<PrescriptionStatus, string> = {
  pending:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  consumed:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
};

export function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
