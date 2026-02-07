/**
 * Reloads app state from Supabase into the store.
 * Safe to call on pull-to-refresh.
 */
import { useStore } from '../stores/useStore';
import { getAccounts } from '../services/accountService';
import { getCategories } from '../services/categoryService';
import { getTransactions } from '../services/transactionService';

export async function refreshFromLocalDb(): Promise<void> {
  const { sessionUser, selectedAccountId, setAccounts, setCategories, setTransactions } =
    useStore.getState();
  if (!sessionUser?.id) return;

  const [accts, cats] = await Promise.all([
    getAccounts(sessionUser.id),
    getCategories(sessionUser.id),
  ]);
  setAccounts(accts);
  setCategories(cats);

  if (selectedAccountId) {
    const tx = await getTransactions(selectedAccountId);
    setTransactions(tx);
  }
}
