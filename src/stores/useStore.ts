import { create } from 'zustand';
import type { Account, Transaction, Category } from '../types';
import { getGuestUserId } from '../lib/guestUserId';

interface AppState {
  user: { id: string } | null;
  /** Set when logged in via Supabase Auth; null when guest */
  sessionUser: { id: string; email: string } | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  selectedAccountId: string | null;
  isOnline: boolean;
  pendingSyncCount: number;
  setUser: (user: { id: string } | null) => void;
  setSessionUser: (user: { id: string; email: string } | null) => void;
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedAccountId: (id: string | null) => void;
  setIsOnline: (v: boolean) => void;
  setPendingSyncCount: (n: number) => void;
  addAccount: (a: Account) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addCategory: (c: Category) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  removeCategory: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: typeof localStorage !== 'undefined' ? { id: getGuestUserId() } : null,
  sessionUser: null,
  accounts: [],
  transactions: [],
  categories: [],
  selectedAccountId: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  setUser: (user) => set({ user }),
  setSessionUser: (sessionUser) => set({ sessionUser }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  addAccount: (a) => set((s) => ({ accounts: [...s.accounts, a] })),
  updateAccount: (id, a) =>
    set((s) => ({
      accounts: s.accounts.map((x) => (x.id === id ? { ...x, ...a } : x)),
    })),
  removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== id) })),
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  updateTransaction: (id, t) =>
    set((s) => ({
      transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)),
    })),
  removeTransaction: (id) =>
    set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) })),
  addCategory: (c) => set((s) => ({ categories: [...s.categories, c] })),
  updateCategory: (id, c) =>
    set((s) => ({
      categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)),
    })),
  removeCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),
}));
