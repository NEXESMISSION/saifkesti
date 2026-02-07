import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Trash2, Pencil } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { deleteTransaction, updateTransaction } from '../services/transactionService';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Transaction as Tx, TransactionType } from '../types';

export function TransactionList({
  transactions,
  categories,
}: {
  transactions: Tx[];
  categories: { id: string; name: string; type: TransactionType }[];
}) {
  const removeTransaction = useStore((s) => s.removeTransaction);
  const updateTransactionInStore = useStore((s) => s.updateTransaction);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setType(editing.type);
      setDescription(editing.description ?? '');
      setDate(editing.date);
      setCategoryId(editing.category_id ?? '');
    }
  }, [editing]);

  async function handleDelete(t: Tx) {
    removeTransaction(t.id);
    await deleteTransaction(t.id);
  }

  function openEdit(t: Tx) {
    setEditing(t);
  }

  function closeEdit() {
    setEditing(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) return;
    await updateTransaction(editing.id, {
      amount: numAmount,
      type,
      description: description.trim() || null,
      date: date || editing.date,
      category_id: categoryId || null,
    });
    updateTransactionInStore(editing.id, {
      amount: numAmount,
      type,
      description: description.trim() || null,
      date: date || editing.date,
      category_id: categoryId || null,
    });
    closeEdit();
  }

  function categoryName(id: string | null) {
    if (!id) return 'Uncategorized';
    return categories.find((c) => c.id === id)?.name ?? 'Uncategorized';
  }

  const typeCategories = categories.filter((c) => c.type === type);

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No transactions yet. Tap + to add one.
      </div>
    );
  }

  return (
    <>
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
            <div className="flex shrink-0 items-center gap-1">
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
              <button
                type="button"
                onClick={() => openEdit(t)}
                className="rounded p-1.5 text-slate-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(t)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">Edit transaction</DialogTitle>
          <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-slate-200 py-2 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === 'income'}
                  onChange={() => setType('income')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Income</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-slate-200 py-2 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === 'expense'}
                  onChange={() => setType('expense')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">Expense</span>
              </label>
            </div>
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder="Optional"
              />
            </div>
            {typeCategories.length > 0 && (
              <div>
                <Label>Category</Label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {typeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={closeEdit} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
