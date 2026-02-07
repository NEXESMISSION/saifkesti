import { useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Tags, BarChart3, LogIn, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../stores/useStore';
import { getAccounts } from '../services/accountService';
import { getCategories, seedDefaultCategories } from '../services/categoryService';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/businesses', label: 'Businesses', icon: Building2 },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/recap', label: 'Recap', icon: BarChart3 },
];

export function AppLayout() {
  const location = useLocation();
  const sessionUser = useStore((s) => s.sessionUser);
  const user = useStore((s) => s.user);
  const accounts = useStore((s) => s.accounts);
  const setAccounts = useStore((s) => s.setAccounts);
  const setCategories = useStore((s) => s.setCategories);
  const setSelectedAccountId = useStore((s) => s.setSelectedAccountId);
  const selectedAccountId = useStore((s) => s.selectedAccountId);

  useEffect(() => {
    if (!user?.id || accounts.length > 0) return;
    (async () => {
      const [accts, cats] = await Promise.all([
        getAccounts(user.id),
        getCategories(user.id),
      ]);
      if (accts.length > 0) {
        setAccounts(accts);
        if (!selectedAccountId) setSelectedAccountId(accts[0].id);
      }
      if (cats.length === 0) await seedDefaultCategories(user.id);
      const allCats = await getCategories(user.id);
      setCategories(allCats);
    })();
  }, [user?.id, accounts.length, setAccounts, setCategories, setSelectedAccountId, selectedAccountId]);

  async function handleSignOut() {
    await supabase?.auth.signOut();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
            Finance Tracker
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden gap-0.5 md:flex" aria-label="Main">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            {supabase &&
              (sessionUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="ml-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden max-w-[120px] truncate sm:inline">{sessionUser.email}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
              ))}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 gap-1 px-2 pb-safe">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
