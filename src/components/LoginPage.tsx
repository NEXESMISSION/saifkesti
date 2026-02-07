import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-800 backdrop-blur-sm">
          <p className="font-semibold">Supabase not configured</p>
          <p className="mt-2 text-sm text-amber-700">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
          </p>
        </div>
      </div>
    );
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('/', { replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('Check your email to confirm your account, then sign in.');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/20">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
              Finance Tracker
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
                {message}
              </p>
            )}

            <div className="space-y-3 pt-1">
              <Button
                type="submit"
                className="h-11 w-full rounded-xl font-medium"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full rounded-xl font-medium"
                disabled={loading}
                onClick={handleSignUp}
              >
                Create account
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Your data is stored securely and synced when you sign in.
        </p>
      </div>
    </div>
  );
}
