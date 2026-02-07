-- Finance Tracker Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Accounts (business/personal)
create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('business', 'personal')),
  initial_balance decimal(15,2) default 0,
  current_balance decimal(15,2) default 0,
  color text default '#6366f1',
  icon text default 'wallet',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories (income/expense)
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text default 'tag',
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references public.accounts(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount decimal(15,2) not null,
  type text not null check (type in ('income', 'expense')),
  description text,
  date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Balance snapshots (daily history)
create table public.balance_snapshots (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references public.accounts(id) on delete cascade not null,
  balance decimal(15,2) not null,
  snapshot_date date not null,
  created_at timestamptz default now(),
  unique(account_id, snapshot_date)
);

-- Trigger: update account balance on transaction change
create or replace function update_account_balance()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'income' then
      update public.accounts set current_balance = current_balance + new.amount, updated_at = now() where id = new.account_id;
    else
      update public.accounts set current_balance = current_balance - new.amount, updated_at = now() where id = new.account_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.type = 'income' then
      update public.accounts set current_balance = current_balance - old.amount, updated_at = now() where id = old.account_id;
    else
      update public.accounts set current_balance = current_balance + old.amount, updated_at = now() where id = old.account_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.account_id = new.account_id then
      if old.type = 'income' then
        update public.accounts set current_balance = current_balance - old.amount, updated_at = now() where id = old.account_id;
      else
        update public.accounts set current_balance = current_balance + old.amount, updated_at = now() where id = old.account_id;
      end if;
      if new.type = 'income' then
        update public.accounts set current_balance = current_balance + new.amount, updated_at = now() where id = new.account_id;
      else
        update public.accounts set current_balance = current_balance - new.amount, updated_at = now() where id = new.account_id;
      end if;
    else
      if old.type = 'income' then
        update public.accounts set current_balance = current_balance - old.amount, updated_at = now() where id = old.account_id;
      else
        update public.accounts set current_balance = current_balance + old.amount, updated_at = now() where id = old.account_id;
      end if;
      if new.type = 'income' then
        update public.accounts set current_balance = current_balance + new.amount, updated_at = now() where id = new.account_id;
      else
        update public.accounts set current_balance = current_balance - new.amount, updated_at = now() where id = new.account_id;
      end if;
    end if;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_transaction_change
  after insert or update or delete on public.transactions
  for each row execute function update_account_balance();

-- Profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.balance_snapshots enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id);
create policy "Users can manage transactions via accounts" on public.transactions for all
  using (exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid()));
create policy "Users can manage balance_snapshots via accounts" on public.balance_snapshots for all
  using (exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid()));

-- Indexes
create index idx_accounts_user_id on public.accounts(user_id);
create index idx_categories_user_id on public.categories(user_id);
create index idx_transactions_account_id on public.transactions(account_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_balance_snapshots_account_date on public.balance_snapshots(account_id, snapshot_date);
