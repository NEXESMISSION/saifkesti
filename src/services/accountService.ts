import { db } from '../lib/db';
import { enqueueSync } from '../lib/syncManager';
import type { Account } from '../types';

export async function getAccounts(userId: string): Promise<Account[]> {
  return db.accounts.where('user_id').equals(userId).toArray();
}

export async function createAccount(userId: string, account: Omit<Account, 'id' | 'user_id' | 'current_balance' | 'created_at' | 'updated_at'>): Promise<Account> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newAccount: Account = {
    id,
    user_id: userId,
    name: account.name,
    type: account.type,
    initial_balance: account.initial_balance ?? 0,
    current_balance: account.initial_balance ?? 0,
    color: account.color ?? '#6366f1',
    icon: account.icon ?? 'wallet',
    created_at: now,
    updated_at: now,
  };
  await db.accounts.add(newAccount);
  await enqueueSync({
    operation: 'insert',
    table: 'accounts',
    record_id: id,
    payload: { ...newAccount },
    sync_status: 'pending',
  });
  return newAccount;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<void> {
  const existing = await db.accounts.get(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.accounts.put(updated);
  await enqueueSync({
    operation: 'update',
    table: 'accounts',
    record_id: id,
    payload: updated,
    sync_status: 'pending',
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await db.accounts.delete(id);
  await enqueueSync({
    operation: 'delete',
    table: 'accounts',
    record_id: id,
    sync_status: 'pending',
  });
}
