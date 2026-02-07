import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AccountSelector } from './AccountSelector';
import { useStore } from '../stores/useStore';
import { createTransaction } from '../services/transactionService';
import type { TransactionType } from '../types';
import { format } from 'date-fns';

const schema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  description: z.string(),
  accountId: z.string().min(1, 'Select an account'),
  categoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const selectedAccountId = useStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useStore((s) => s.setSelectedAccountId);
  const addTransaction = useStore((s) => s.addTransaction);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      description: '',
      accountId: '',
      categoryId: undefined,
    },
  });

  const type = watch('type');
  const accountId = watch('accountId');
  const categoryId = watch('categoryId');
  const filteredCategories = categories.filter((c) => c.type === type);

  // When dialog opens, sync form with current selection or first account
  useEffect(() => {
    if (!open) return;
    const id = selectedAccountId || accounts[0]?.id || '';
    setValue('accountId', id);
    if (id && !selectedAccountId) setSelectedAccountId(id);
  }, [open, accounts, selectedAccountId, setValue, setSelectedAccountId]);

  // When type changes, clear category if it's not in the new type's list
  useEffect(() => {
    if (!open) return;
    const validIds = new Set(filteredCategories.map((c) => c.id));
    if (categoryId && !validIds.has(categoryId)) {
      setValue('categoryId', undefined);
    }
  }, [type, open, categoryId, filteredCategories, setValue]);

  async function onSubmit(data: FormData) {
    const tx = await createTransaction(data.accountId, {
      amount: data.amount,
      type: data.type as TransactionType,
      description: data.description || null,
      date: format(new Date(), 'yyyy-MM-dd'),
      category_id: data.categoryId || null,
    });
    addTransaction(tx);
    setSelectedAccountId(data.accountId);
    reset({ type: 'expense', description: '', accountId: data.accountId, categoryId: undefined });
    setOpen(false);
  }

  // Use form value for selector so it's the single source of truth; fallback to first account when we have accounts
  const displayAccountId = accountId || accounts[0]?.id || null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 md:bottom-6 md:right-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">Quick add</DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <Label>Account</Label>
              <div className="mt-1">
                <AccountSelector
                  accounts={accounts}
                  selectedId={displayAccountId}
                  onSelect={(id) => {
                    setValue('accountId', id, { shouldValidate: true });
                    setSelectedAccountId(id);
                  }}
                />
              </div>
              {errors.accountId && (
                <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-slate-200 py-2 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input type="radio" value="income" {...register('type')} className="sr-only" />
                <span className="text-sm font-medium">Income</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-slate-200 py-2 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                <input type="radio" value="expense" {...register('type')} className="sr-only" />
                <span className="text-sm font-medium">Expense</span>
              </label>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                className="mt-1"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                className="mt-1"
                placeholder="Optional"
                {...register('description')}
              />
            </div>
            {filteredCategories.length > 0 && (
              <div>
                <Label htmlFor="quickadd-category">Category</Label>
                <select
                  id="quickadd-category"
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  {...register('categoryId')}
                >
                  <option value="">Uncategorized</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
