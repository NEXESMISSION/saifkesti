import { useEffect, useMemo, useState } from 'react';
import { format, subMonths, startOfYear } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Percent, ArrowRightLeft } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { getTransactions } from '../services/transactionService';
import { AccountSelector } from './AccountSelector';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export type RecapPeriod = '1' | '3' | '6' | '12' | 'ytd' | 'all';

const PERIODS: { value: RecapPeriod; label: string }[] = [
  { value: '1', label: '1 mo' },
  { value: '3', label: '3 mo' },
  { value: '6', label: '6 mo' },
  { value: '12', label: '12 mo' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All' },
];

export function RecapPage() {
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const selectedAccountId = useStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useStore((s) => s.setSelectedAccountId);
  const transactions = useStore((s) => s.transactions);
  const setTransactions = useStore((s) => s.setTransactions);

  const [period, setPeriod] = useState<RecapPeriod>('12');

  useEffect(() => {
    if (selectedAccountId) {
      getTransactions(selectedAccountId).then(setTransactions);
    }
  }, [selectedAccountId, setTransactions]);

  const {
    monthlyData,
    categoryData,
    totalIncome,
    totalExpense,
    netFlow,
    savingsRate,
    previousNetFlow,
    periodChangePercent,
  } = useMemo(() => {
    const now = new Date();
    let start: string;
    let monthsBack: number;

    if (period === 'all') {
      start = '1970-01-01';
      monthsBack = 24;
    } else if (period === 'ytd') {
      start = format(startOfYear(now), 'yyyy-MM-dd');
      monthsBack = now.getMonth() + 1;
    } else {
      monthsBack = period === '1' ? 1 : period === '3' ? 3 : period === '6' ? 6 : 12;
      start = format(subMonths(now, monthsBack), 'yyyy-MM-dd');
    }

    const filtered = transactions.filter((t) => t.date >= start);

    const byMonth: Record<string, { income: number; expense: number; month: string }> = {};
    const monthCount = period === 'all' ? 24 : period === 'ytd' ? monthsBack : monthsBack;
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      byMonth[key] = { month: format(d, 'MMM yyyy'), income: 0, expense: 0 };
    }
    filtered.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { month: format(new Date(t.date), 'MMM yyyy'), income: 0, expense: 0 };
      if (t.type === 'income') byMonth[key].income += t.amount;
      else byMonth[key].expense += t.amount;
    });

    const byCategory: Record<string, number> = {};
    filtered.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.category_id ? (categories.find((c) => c.id === t.category_id)?.name ?? 'Other') : 'Uncategorized';
      byCategory[name] = (byCategory[name] ?? 0) + t.amount;
    });

    let monthlyArray = Object.keys(byMonth)
      .sort()
      .map((k) => byMonth[k]);
    if (period === 'all' && monthlyArray.length > 24) {
      monthlyArray = monthlyArray.slice(-24);
    }
    const categoryArray = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingsRateNum = income > 0 ? (net / income) * 100 : 0;

    const half = Math.max(1, Math.floor(monthCount / 2));
    const previousStart = format(subMonths(now, monthCount), 'yyyy-MM-dd');
    const previousEnd = format(subMonths(now, half), 'yyyy-MM-dd');
    const prevFiltered = transactions.filter((t) => t.date >= previousStart && t.date < previousEnd);
    const prevNet =
      prevFiltered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
      prevFiltered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const periodChangePercentNum =
      prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet)) * 100 : (net !== 0 ? 100 : 0);

    return {
      monthlyData: monthlyArray,
      categoryData: categoryArray,
      totalIncome: income,
      totalExpense: expense,
      netFlow: net,
      savingsRate: savingsRateNum,
      previousNetFlow: prevNet,
      periodChangePercent: periodChangePercentNum,
    };
  }, [transactions, categories, period]);

  const COLORS = ['#059669', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#84cc16', '#06b6d4'];

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) setSelectedAccountId(accounts[0].id);
  }, [accounts.length, selectedAccountId, setSelectedAccountId]);

  const maxCategoryValue = categoryData[0]?.value ?? 1;

  return (
    <div className="space-y-5 pb-6 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">Recap & reports</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <AccountSelector
              accounts={accounts}
              selectedId={selectedAccountId}
              onSelect={setSelectedAccountId}
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  period === p.value ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedAccountId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-zinc-500">Add a business or account first to see recap.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-5">
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Total income
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                  +{totalIncome.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Total expense
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-red-600 sm:text-3xl">
                  −{totalExpense.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <ArrowRightLeft className="h-4 w-4 text-zinc-400" /> Net flow
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                    netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {netFlow >= 0 ? '+' : ''}{netFlow.toFixed(2)}
                </p>
                {previousNetFlow !== 0 && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    vs previous half: {periodChangePercent >= 0 ? '+' : ''}{periodChangePercent.toFixed(0)}%
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                  <Percent className="h-4 w-4 text-zinc-400" /> Savings rate
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  {savingsRate.toFixed(1)}%
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {totalIncome > 0 ? 'of income saved' : 'No income in period'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Income vs expense by month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#71717a" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(value: number | undefined) => [value != null ? value.toFixed(2) : '0', '']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="income" name="Income" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spending by category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-zinc-500">No expense data in this period.</p>
                    <p className="mt-1 text-xs text-zinc-400">Add expenses to see breakdown by category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-52 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number | undefined) => (value != null ? value.toFixed(2) : '')} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="border-t border-zinc-100 pt-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Top categories
                      </p>
                      <ul className="space-y-2">
                        {categoryData.slice(0, 6).map((row, i) => (
                          <li key={row.name} className="flex items-center gap-3">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">{row.name}</span>
                            <span className="text-sm font-medium text-zinc-900">{row.value.toFixed(2)}</span>
                            <div className="hidden w-16 overflow-hidden rounded-full bg-zinc-100 sm:block">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${(row.value / maxCategoryValue) * 100}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Period summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Income</span>
                  <span className="font-medium text-emerald-600">+{totalIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Expense</span>
                  <span className="font-medium text-red-600">−{totalExpense.toFixed(2)}</span>
                </div>
                <div className="border-t border-zinc-100 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-zinc-700">Net flow</span>
                    <span className={`font-semibold ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {netFlow >= 0 ? '+' : ''}{netFlow.toFixed(2)}
                    </span>
                  </div>
                </div>
                {totalIncome > 0 && (
                  <div className="rounded-xl bg-zinc-50 p-3">
                    <p className="text-xs font-medium text-zinc-500">Savings rate</p>
                    <p className="text-xl font-bold text-zinc-900">{savingsRate.toFixed(1)}%</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      You {netFlow >= 0 ? 'saved' : 'spent'} {Math.abs(netFlow).toFixed(2)} of {totalIncome.toFixed(2)} income.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
