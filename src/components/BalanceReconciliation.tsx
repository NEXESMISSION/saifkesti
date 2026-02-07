import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useStore } from '../stores/useStore';
import { createTransaction } from '../services/transactionService';
import { getPendingSyncCount } from '../services/transactionService';
import type { Account } from '../types';

export function BalanceReconciliation({
  open,
  onOpenChange,
  account,
  calculatedBalance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  calculatedBalance: number;
}) {
  const [actualBalance, setActualBalance] = useState('');
  const addTransaction = useStore((s) => s.addTransaction);
  const setPendingSyncCount = useStore((s) => s.setPendingSyncCount);
  const categories = useStore((s) => s.categories);
  const lostCategory = categories.find((c) => c.name === 'Lost/Unknown');

  if (!account) return null;

  const actual = parseFloat(actualBalance) || 0;
  const difference = actual - calculatedBalance;

  async function handleReconcile() {
    if (!account || !lostCategory || difference === 0) {
      onOpenChange(false);
      return;
    }
    const type = difference > 0 ? 'income' : 'expense';
    const amount = Math.abs(difference);
    const tx = await createTransaction(account.id, {
      amount,
      type,
      description: 'Balance reconciliation adjustment',
      date: new Date().toISOString().slice(0, 10),
      category_id: lostCategory.id,
    });
    addTransaction({ ...tx, sync_status: 'pending' });
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
    setActualBalance('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold">Reconcile balance</DialogTitle>
        <p className="mt-1 text-sm text-slate-500">{account.name}</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Calculated balance</Label>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {calculatedBalance.toFixed(2)}
            </p>
          </div>
          <div>
            <Label htmlFor="actual">Actual balance</Label>
            <Input
              id="actual"
              type="number"
              step="0.01"
              value={actualBalance}
              onChange={(e) => setActualBalance(e.target.value)}
              className="mt-1"
            />
          </div>
          {actualBalance && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Difference</p>
              <p
                className={
                  difference === 0
                    ? 'text-slate-900'
                    : difference > 0
                      ? 'text-emerald-600 font-medium'
                      : 'text-red-600 font-medium'
                }
              >
                {difference === 0 ? 'No difference' : `${difference > 0 ? '+' : ''}${difference.toFixed(2)}`}
              </p>
              {difference !== 0 && !lostCategory && (
                <p className="mt-1 text-xs text-amber-700">
                  Add a Lost/Unknown category to create an adjustment transaction.
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleReconcile}
              className="flex-1"
              disabled={!actualBalance || (difference !== 0 && !lostCategory)}
            >
              Reconcile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
