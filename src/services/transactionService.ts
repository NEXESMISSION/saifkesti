import { db } from '../lib/db';
import { enqueueSync } from '../lib/syncManager';
import type { Transaction } from '../types';

export async function getTransactions(accountId: string | null): Promise<Transaction[]> {
  if (!accountId) return [];
  const list = await db.transactions.where('account_id').equals(accountId).reverse().sortBy('date');
  return list.map((t) => ({
    ...t,
    sync_status: (t as Transaction & { sync_status?: string }).sync_status ?? 'synced',
  }));
}

export async function createTransaction(
  accountId: string,
  tx: Omit<Transaction, 'id' | 'account_id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const newTx: Transaction & { sync_status?: 'synced' | 'pending' | 'failed' } = {
    id,
    account_id: accountId,
    category_id: tx.category_id ?? null,
    amount: tx.amount,
    type: tx.type,
    description: tx.description ?? null,
    date: tx.date,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  };
  await db.transactions.add(newTx);
  await enqueueSync({
    operation: 'insert',
    table: 'transactions',
    record_id: id,
    payload: {
      id: newTx.id,
      account_id: newTx.account_id,
      category_id: newTx.category_id,
      amount: newTx.amount,
      type: newTx.type,
      description: newTx.description,
      date: newTx.date,
      created_at: newTx.created_at,
      updated_at: newTx.updated_at,
    },
    sync_status: 'pending',
  });
  return newTx as Transaction;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
  await db.transactions.put(updated);
  await enqueueSync({
    operation: 'update',
    table: 'transactions',
    record_id: id,
    payload: updated,
    sync_status: 'pending',
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
  await enqueueSync({
    operation: 'delete',
    table: 'transactions',
    record_id: id,
    sync_status: 'pending',
  });
}

export async function getPendingSyncCount(): Promise<number> {
  return db.syncQueue.where('sync_status').equals('pending').count();
}
