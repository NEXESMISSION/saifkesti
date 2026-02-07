import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { deleteTransaction } from '../services/transactionService';
import { getPendingSyncCount } from '../services/transactionService';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { Transaction as Tx, SyncStatus } from '../types';

export function TransactionList({
  transactions,
  categories,
  onRefreshPending,
}: {
  transactions: Tx[];
  categories: { id: string; name: string }[];
  onRefreshPending?: () => void;
}) {
  const removeTransaction = useStore((s) => s.removeTransaction);
  const setPendingSyncCount = useStore((s) => s.setPendingSyncCount);

  async function handleDelete(t: Tx) {
    removeTransaction(t.id);
    await deleteTransaction(t.id);
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
    onRefreshPending?.();
  }

  function categoryName(id: string | null) {
    if (!id) return 'Uncategorized';
    return categories.find((c) => c.id === id)?.name ?? 'Uncategorized';
  }

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No transactions yet. Tap + to add one.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-2 py-3 first:pt-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">
              {t.description || categoryName(t.category_id)}
            </p>
            <p className="text-xs text-slate-500">
              {format(new Date(t.date), 'MMM d, yyyy')} · {categoryName(t.category_id)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={
                t.type === 'income'
                  ? 'text-emerald-600 font-medium'
                  : 'text-red-600 font-medium'
              }
            >
              {t.type === 'income' ? '+' : '-'}
              {Math.abs(t.amount).toFixed(2)}
            </span>
            <SyncStatusBadge status={(t as Tx & { sync_status?: SyncStatus }).sync_status} />
            <button
              type="button"
              onClick={() => handleDelete(t)}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
