import { supabase } from '../lib/supabase';
import type { Account } from '../types';

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    type: row.type as Account['type'],
    initial_balance: Number(row.initial_balance ?? 0),
    current_balance: Number(row.current_balance ?? 0),
    color: (row.color as string) ?? '#6366f1',
    icon: (row.icon as string) ?? 'wallet',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAccounts(userId: string): Promise<Account[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAccount);
}

export async function createAccount(
  userId: string,
  account: Omit<Account, 'id' | 'user_id' | 'current_balance' | 'created_at' | 'updated_at'>
): Promise<Account> {
  if (!supabase) throw new Error('Not configured');
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance ?? 0,
      current_balance: account.initial_balance ?? 0,
      color: account.color ?? '#6366f1',
      icon: account.icon ?? 'wallet',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToAccount(data);
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<void> {
  if (!supabase) return;
  const payload: Record<string, unknown> = { ...updates };
  delete payload.id;
  delete payload.user_id;
  delete payload.created_at;
  const { error } = await supabase.from('accounts').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
