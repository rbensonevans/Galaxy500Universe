-- Personal feeds private, Startup Feed public: personal-feed posts (no
-- startup_id) are visible only to their author; Startup Feed posts (startup_id
-- set) are visible to any signed-in member so the community can engage.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_select_own" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select using (
  auth.uid() = user_id
  or (auth.uid() is not null and startup_id is not null)
);
