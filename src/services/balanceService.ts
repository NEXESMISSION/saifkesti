import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  let balance = initialBalance;
  for (const t of transactions) {
    if (t.type === 'income') balance += t.amount;
    else balance -= t.amount;
  }
  return balance;
}

export async function getBalanceForAccount(accountId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('id', accountId)
    .single();
  if (error || !data) return 0;
  return Number(data.current_balance ?? 0);
}
