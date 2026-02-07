import type { SyncStatus } from '../types';
import { Check, Clock, AlertCircle } from 'lucide-react';

const config: Record<SyncStatus, { icon: typeof Check; label: string; className: string }> = {
  synced: { icon: Check, label: 'Synced', className: 'bg-emerald-100 text-emerald-800' },
  pending: { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  failed: { icon: AlertCircle, label: 'Failed', className: 'bg-red-100 text-red-800' },
};

export function SyncStatusBadge({ status }: { status?: SyncStatus }) {
  const s = status ?? 'synced';
  const { icon: Icon, label, className } = config[s];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      title={label}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
