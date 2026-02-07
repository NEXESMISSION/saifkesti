-- Finance Tracker – Supabase schema (safe to run multiple times)
-- Run this in Supabase SQL Editor. No duplicate errors if you run it again.

-- 1. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables (only created if they don't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('business', 'personal')),
  initial_balance decimal(15,2) DEFAULT 0,
  current_balance decimal(15,2) DEFAULT 0,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'wallet',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text DEFAULT 'tag',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount decimal(15,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.balance_snapshots (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  balance decimal(15,2) NOT NULL,
  snapshot_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(account_id, snapshot_date)
);

-- 3. Trigger function (replaced if already exists)
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance + new.amount, updated_at = now() WHERE id = new.account_id;
    ELSE
      UPDATE public.accounts SET current_balance = current_balance - new.amount, updated_at = now() WHERE id = new.account_id;
    END IF;
  ELSIF tg_op = 'DELETE' THEN
    IF old.type = 'income' THEN
      UPDATE public.accounts SET current_balance = current_balance - old.amount, updated_at = now() WHERE id = old.account_id;
    ELSE
      UPDATE public.accounts SET current_balance = current_balance + old.amount, updated_at = now() WHERE id = old.account_id;
    END IF;
  ELSIF tg_op = 'UPDATE' THEN
    IF old.account_id = new.account_id THEN
      IF old.type = 'income' THEN
        UPDATE public.accounts SET current_balance = current_balance - old.amount, updated_at = now() WHERE id = old.account_id;
      ELSE
        UPDATE public.accounts SET current_balance = current_balance + old.amount, updated_at = now() WHERE id = old.account_id;
      END IF;
      IF new.type = 'income' THEN
        UPDATE public.accounts SET current_balance = current_balance + new.amount, updated_at = now() WHERE id = new.account_id;
      ELSE
        UPDATE public.accounts SET current_balance = current_balance - new.amount, updated_at = now() WHERE id = new.account_id;
      END IF;
    ELSE
      IF old.type = 'income' THEN
        UPDATE public.accounts SET current_balance = current_balance - old.amount, updated_at = now() WHERE id = old.account_id;
      ELSE
        UPDATE public.accounts SET current_balance = current_balance + old.amount, updated_at = now() WHERE id = old.account_id;
      END IF;
      IF new.type = 'income' THEN
        UPDATE public.accounts SET current_balance = current_balance + new.amount, updated_at = now() WHERE id = new.account_id;
      ELSE
        UPDATE public.accounts SET current_balance = current_balance - new.amount, updated_at = now() WHERE id = new.account_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(new, old);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: drop then create so re-run doesn't fail
DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS (safe to run again)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_snapshots ENABLE ROW LEVEL SECURITY;

-- 5. Policies: drop if exists then create
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;
CREATE POLICY "Users can manage own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage transactions via accounts" ON public.transactions;
CREATE POLICY "Users can manage transactions via accounts" ON public.transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage balance_snapshots via accounts" ON public.balance_snapshots;
CREATE POLICY "Users can manage balance_snapshots via accounts" ON public.balance_snapshots FOR ALL
  USING (EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid()));

-- 6. Indexes (only created if they don't exist)
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_account_date ON public.balance_snapshots(account_id, snapshot_date);
