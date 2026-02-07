import { useState } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import type { Category } from '../types';

export function CategoriesPage() {
  const sessionUser = useStore((s) => s.sessionUser);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategoryInStore = useStore((s) => s.updateCategory);
  const removeCategory = useStore((s) => s.removeCategory);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  function openAdd() {
    setEditingId(null);
    setName('');
    setType('expense');
    setDialogOpen(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setType(c.type);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionUser?.id || !name.trim()) return;
    if (editingId) {
      await updateCategory(editingId, { name: name.trim(), type });
      updateCategoryInStore(editingId, { name: name.trim(), type });
      closeDialog();
      return;
    }
    const category = await createCategory(sessionUser.id, {
      name: name.trim(),
      type,
      icon: 'tag',
      is_system: false,
    });
    addCategory(category);
    closeDialog();
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
    removeCategory(id);
    setDeleteConfirmId(null);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Manage categories</h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <Plus className="h-4 w-4" />
          Add category
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-zinc-100 px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-red-700">Expense categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {expenseCategories.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">No expense categories.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {expenseCategories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-3">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-zinc-400" />
                      <span className="font-medium text-zinc-900">{c.name}</span>
                      {c.is_system && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">System</span>
                      )}
                    </span>
                    {!c.is_system && (
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-zinc-100 px-5 py-3.5">
            <CardTitle className="text-base font-semibold text-emerald-700">Income categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {incomeCategories.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">No income categories.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {incomeCategories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-5 py-3">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-zinc-400" />
                      <span className="font-medium text-zinc-900">{c.name}</span>
                      {c.is_system && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">System</span>
                      )}
                    </span>
                    {!c.is_system && (
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">
            {editingId ? 'Edit category' : 'New category'}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Groceries, Salary"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <div className="mt-1 flex gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 py-2.5 text-sm has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                  <input type="radio" name="c-type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="sr-only" />
                  Expense
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 py-2.5 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                  <input type="radio" name="c-type" value="income" checked={type === 'income'} onChange={() => setType('income')} className="sr-only" />
                  Income
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={closeDialog} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!name.trim()}>
                {editingId ? 'Save' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent showClose={true}>
          <DialogTitle className="text-lg font-semibold">Delete category?</DialogTitle>
          <p className="mt-2 text-sm text-slate-600">
            Transactions using this category will keep it as reference. You can add it again later.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
