import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    account_id: row.account_id as string,
    category_id: (row.category_id as string) ?? null,
    amount: Number(row.amount ?? 0),
    type: row.type as Transaction['type'],
    description: (row.description as string) ?? null,
    date: row.date as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getTransactions(accountId: string | null): Promise<Transaction[]> {
  if (!supabase || !accountId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTransaction);
}

export async function createTransaction(
  accountId: string,
  tx: Omit<Transaction, 'id' | 'account_id' | 'created_at' | 'updated_at'>
): Promise<Transaction> {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      category_id: tx.category_id ?? null,
      amount: tx.amount,
      type: tx.type,
      description: tx.description ?? null,
      date: tx.date,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToTransaction(data);
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = { ...updates };
  delete payload.id;
  delete payload.account_id;
  delete payload.created_at;
  const { error } = await supabase.from('transactions').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
