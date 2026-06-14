-- Restrict post visibility to the author across all feeds: a member sees only
-- the postings they created. Enforced via RLS so it holds at the API layer too.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own" on public.posts for select using (auth.uid() = user_id);
