-- Database Schema for WealthManager (Supabase)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (linked to Supabase Auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create a profile when a user registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CATEGORIES Table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense', 'asset')),
  color text not null default '#4F46E5', -- hex code
  icon text not null default 'HelpCircle', -- Lucide icon name
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Users can view own categories" 
  on public.categories for select 
  using (auth.uid() = user_id or user_id is null); -- allows system/global categories too

create policy "Users can insert own categories" 
  on public.categories for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own categories" 
  on public.categories for update 
  using (auth.uid() = user_id);

create policy "Users can delete own categories" 
  on public.categories for delete 
  using (auth.uid() = user_id);


-- 3. TRANSACTIONS Table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null check (amount >= 0),
  description text,
  type text not null check (type in ('income', 'expense')),
  date date default current_date not null,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" 
  on public.transactions for select 
  using (auth.uid() = user_id);

create policy "Users can insert own transactions" 
  on public.transactions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own transactions" 
  on public.transactions for update 
  using (auth.uid() = user_id);

create policy "Users can delete own transactions" 
  on public.transactions for delete 
  using (auth.uid() = user_id);


-- 4. ASSETS Table
create table if not exists public.assets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('property', 'investment', 'savings', 'vehicle', 'others')),
  balance numeric default 0 not null,
  details text, -- e.g. "3 Rekening Aktif", "1 Mobil Pribadi"
  change_percentage numeric default 0.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.assets enable row level security;

create policy "Users can view own assets" 
  on public.assets for select 
  using (auth.uid() = user_id);

create policy "Users can insert own assets" 
  on public.assets for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own assets" 
  on public.assets for update 
  using (auth.uid() = user_id);

create policy "Users can delete own assets" 
  on public.assets for delete 
  using (auth.uid() = user_id);


-- 5. DEBTS & RECEIVABLES Table
create table if not exists public.debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_name text not null,
  amount numeric not null check (amount >= 0),
  type text not null check (type in ('debt', 'receivable')), -- 'debt' = hutang, 'receivable' = piutang
  due_date date,
  status text not null default 'Belum Lunas' check (status in ('Lunas', 'Belum Lunas', 'Terlambat')),
  notes text,
  reference_no text, -- e.g. "INV-2023-089"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.debts enable row level security;

create policy "Users can view own debts" 
  on public.debts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own debts" 
  on public.debts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own debts" 
  on public.debts for update 
  using (auth.uid() = user_id);

create policy "Users can delete own debts" 
  on public.debts for delete 
  using (auth.uid() = user_id);


-- 6. SAVINGS GOALS Table
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric default 0 not null check (current_amount >= 0),
  deadline date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;

create policy "Users can view own goals" 
  on public.goals for select 
  using (auth.uid() = user_id);

create policy "Users can insert own goals" 
  on public.goals for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own goals" 
  on public.goals for update 
  using (auth.uid() = user_id);

create policy "Users can delete own goals" 
  on public.goals for delete 
  using (auth.uid() = user_id);


-- 7. NOTIFICATIONS Table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'general', -- e.g. 'debt_reminder', 'goal_milestone', 'system'
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" 
  on public.notifications for select 
  using (auth.uid() = user_id);

create policy "Users can update own notifications" 
  on public.notifications for update 
  using (auth.uid() = user_id);

create policy "Users can delete own notifications" 
  on public.notifications for delete 
  using (auth.uid() = user_id);


-- 8. SETTINGS Table
create table if not exists public.settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  currency text default 'IDR' not null,
  theme text default 'light' not null check (theme in ('light', 'dark')),
  notifications_enabled boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings enable row level security;

create policy "Users can view own settings" 
  on public.settings for select 
  using (auth.uid() = user_id);

create policy "Users can insert own settings" 
  on public.settings for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own settings" 
  on public.settings for update 
  using (auth.uid() = user_id);
