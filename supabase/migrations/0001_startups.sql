-- Startups registered by Galaxy500Universe members.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- This script is idempotent: it is safe to run more than once.

-- gen_random_uuid() lives in pgcrypto (enabled by default on Supabase, but
-- ensure it just in case).
create extension if not exists pgcrypto;

create table if not exists public.startups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  name        text not null,
  tagline     text,
  description text,
  website     text,
  industry    text,
  created_at  timestamptz not null default now()
);

-- Row-level security: every member can only read/write their own startups.
alter table public.startups enable row level security;

-- CREATE POLICY has no IF NOT EXISTS, so drop-then-create to stay idempotent.
drop policy if exists "startups_select_own" on public.startups;
create policy "startups_select_own"
  on public.startups for select
  using (auth.uid() = user_id);

drop policy if exists "startups_insert_own" on public.startups;
create policy "startups_insert_own"
  on public.startups for insert
  with check (auth.uid() = user_id);

drop policy if exists "startups_update_own" on public.startups;
create policy "startups_update_own"
  on public.startups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "startups_delete_own" on public.startups;
create policy "startups_delete_own"
  on public.startups for delete
  using (auth.uid() = user_id);

create index if not exists startups_user_created_idx
  on public.startups (user_id, created_at desc);
