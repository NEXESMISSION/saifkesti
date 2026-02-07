import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { getTransactions } from '../services/transactionService';
import { getCategories } from '../services/categoryService';
import { getBalanceForAccount } from '../services/balanceService';
import { subscribeToOnlineStatus } from '../lib/syncManager';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { AccountSelector } from './AccountSelector';
import { TransactionList } from './TransactionList';
import { QuickAdd } from './QuickAdd';
import { OfflineIndicator } from './OfflineIndicator';
import { BalanceReconciliation } from './BalanceReconciliation';
import { Button } from './ui/button';
import { format } from 'date-fns';

export function Dashboard() {
  const sessionUser = useStore((s) => s.sessionUser);
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const selectedAccountId = useStore((s) => s.selectedAccountId);
  const setTransactions = useStore((s) => s.setTransactions);
  const setCategories = useStore((s) => s.setCategories);
  const setSelectedAccountId = useStore((s) => s.setSelectedAccountId);
  const setIsOnline = useStore((s) => s.setIsOnline);
  const [calculatedBalance, setCalculatedBalance] = useState(0);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  // Accounts/categories are loaded and seeded in AppLayout; only refetch categories here if store is empty (e.g. pull-to-refresh)
  useEffect(() => {
    if (!sessionUser?.id) return;
    if (categories.length > 0) return;
    getCategories(sessionUser.id).then(setCategories);
  }, [sessionUser?.id, categories.length, setCategories]);

  useEffect(() => {
    if (!selectedAccountId) return;
    getTransactions(selectedAccountId).then(setTransactions);
    getBalanceForAccount(selectedAccountId).then(setCalculatedBalance);
  }, [selectedAccountId, setTransactions]);

  // Keep balance in sync when transactions are updated (e.g. after pull-to-refresh)
  useEffect(() => {
    if (!selectedAccountId) return;
    getBalanceForAccount(selectedAccountId).then(setCalculatedBalance);
  }, [selectedAccountId, transactions]);

  useEffect(() => {
    const unsub = subscribeToOnlineStatus(setIsOnline);
    return unsub;
  }, [setIsOnline]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
  const monthEnd = format(new Date(), 'yyyy-MM-dd');
  const monthTransactions = transactions.filter(
    (t) => t.date >= monthStart && t.date <= monthEnd
  );
  const income = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-5 pb-6 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Dashboard</h1>
        <div className="w-full sm:w-72">
          <AccountSelector
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        </div>
      </div>

      <div className="space-y-5">
        {selectedAccount && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" style={{ color: selectedAccount.color }} />
                {selectedAccount.name}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setReconcileOpen(true)}>
                Reconcile
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {calculatedBalance.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                This month: <span className="text-emerald-600">+{income.toFixed(2)}</span>
                {' / '}
                <span className="text-red-600">−{expense.toFixed(2)}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={transactions.slice(0, 20)}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </CardContent>
        </Card>
      </div>

      <QuickAdd />
      <OfflineIndicator />
      <BalanceReconciliation
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
        account={selectedAccount ?? null}
        calculatedBalance={calculatedBalance}
      />
    </div>
  );
}
