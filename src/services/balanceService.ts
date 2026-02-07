import { db } from '../lib/db';
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
  const account = await db.accounts.get(accountId);
  if (!account) return 0;
  const transactions = await db.transactions.where('account_id').equals(accountId).toArray();
  return calculateBalance(account.initial_balance, transactions);
}
