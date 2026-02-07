import { useState } from 'react';
import { Plus, Wallet, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { createAccount, updateAccount, deleteAccount } from '../services/accountService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import type { Account, AccountType } from '../types';

export function BusinessesPage() {
  const user = useStore((s) => s.user);
  const accounts = useStore((s) => s.accounts);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccountInStore = useStore((s) => s.updateAccount);
  const removeAccount = useStore((s) => s.removeAccount);
  const selectedAccountId = useStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useStore((s) => s.setSelectedAccountId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('personal');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#6366f1');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setName('');
    setType('personal');
    setInitialBalance('0');
    setColor('#6366f1');
    setDialogOpen(true);
  }

  function openEdit(a: Account) {
    setEditingId(a.id);
    setName(a.name);
    setType(a.type);
    setInitialBalance(String(a.initial_balance));
    setColor(a.color);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !name.trim()) return;
    if (editingId) {
      await updateAccount(editingId, { name: name.trim(), type, initial_balance: parseFloat(initialBalance) || 0, color });
      updateAccountInStore(editingId, { name: name.trim(), type, initial_balance: parseFloat(initialBalance) || 0, color });
      closeDialog();
      return;
    }
    const account = await createAccount(user.id, { name: name.trim(), type, initial_balance: parseFloat(initialBalance) || 0, color, icon: 'wallet' });
    addAccount(account);
    closeDialog();
  }

  async function handleDelete(id: string) {
    await deleteAccount(id);
    removeAccount(id);
    if (selectedAccountId === id) setSelectedAccountId(accounts.find((a) => a.id !== id)?.id ?? null);
    setDeleteConfirmId(null);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Manage businesses</h1>
        <Button onClick={openAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add business
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="mb-4 h-14 w-14 text-zinc-300" />
            <p className="text-zinc-600">No businesses or accounts yet.</p>
            <Button onClick={openAdd} className="mt-4">Add business</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: a.color }}>
                      <Wallet className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">{a.name}</p>
                      <p className="text-sm capitalize text-zinc-500">{a.type}</p>
                      <p className="mt-0.5 text-xl font-bold tracking-tight text-zinc-900">{a.current_balance.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button type="button" onClick={() => openEdit(a)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteConfirmId(a.id)} className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold">{editingId ? 'Edit business' : 'New business'}</DialogTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="b-name">Name</Label>
              <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main wallet" className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <div className="mt-1 flex gap-2">
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800">
                  <input type="radio" name="b-type" value="personal" checked={type === 'personal'} onChange={() => setType('personal')} className="sr-only" />
                  Personal
                </label>
                <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 py-2.5 text-sm font-medium has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-800">
                  <input type="radio" name="b-type" value="business" checked={type === 'business'} onChange={() => setType('business')} className="sr-only" />
                  Business
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="b-initial">Initial balance</Label>
              <Input id="b-initial" type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="b-color">Color</Label>
              <div className="mt-1 flex gap-2">
                <input id="b-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={closeDialog} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={!name.trim()}>{editingId ? 'Save' : 'Add'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent showClose={true}>
          <DialogTitle className="text-lg font-semibold">Delete business?</DialogTitle>
          <p className="mt-2 text-sm text-zinc-600">This will remove the account and all its transactions. This cannot be undone.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="flex-1">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
