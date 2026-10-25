-- Made during the XRP LEDGER HACKATHON
-- Per-post visibility: a personal-feed post can be shared publicly, which puts
-- it on the Universal Feed for every signed-in member. Posts default to
-- private (author-only), so existing posts keep their current visibility.
-- Startup Feed posts (startup_id set) stay visible to all members.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.posts add column if not exists is_public boolean not null default false;

drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select using (
  auth.uid() = user_id
  or (auth.uid() is not null and (startup_id is not null or is_public))
);
