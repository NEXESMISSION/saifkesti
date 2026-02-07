/**
 * Reloads app state from IndexedDB into the store.
 * Does not clear or overwrite IndexedDB; only reads and updates in-memory store.
 * Safe to call on pull-to-refresh or when reopening the app.
 */
import { useStore } from '../stores/useStore';
import { getAccounts } from '../services/accountService';
import { getCategories } from '../services/categoryService';
import { getTransactions } from '../services/transactionService';

export async function refreshFromLocalDb(): Promise<void> {
  const { user, selectedAccountId, setAccounts, setCategories, setTransactions } =
    useStore.getState();
  if (!user?.id) return;

  const [accts, cats] = await Promise.all([
    getAccounts(user.id),
    getCategories(user.id),
  ]);
  setAccounts(accts);
  setCategories(cats);

  if (selectedAccountId) {
    const tx = await getTransactions(selectedAccountId);
    setTransactions(tx);
  }
}
