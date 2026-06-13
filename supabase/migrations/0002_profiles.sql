-- Member profiles for Galaxy500Universe. One row per user, keyed by the
-- auth.users id (a 1:1 extension of the auth account).
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- This script is idempotent: it is safe to run more than once.

create table if not exists public.profiles (
  id           uuid primary key
                 references auth.users (id) on delete cascade,
  display_name text,
  bio          text,
  location     text,
  website      text,
  updated_at   timestamptz not null default now()
);

-- Row-level security: a member can only read/write their own profile.
alter table public.profiles enable row level security;

-- CREATE POLICY has no IF NOT EXISTS, so drop-then-create to stay idempotent.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
