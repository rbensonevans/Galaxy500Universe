-- Company "Startup Feed": posts scoped to a startup. Only the startup's owner
-- (admin) may post; any member can comment (comments are unrestricted).
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.posts
  add column if not exists startup_id uuid references public.startups (id) on delete cascade;
create index if not exists posts_startup_created_idx on public.posts (startup_id, created_at desc);

-- Enforce admin-only posting for startup-scoped posts.
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (
  auth.uid() = user_id
  and (
    startup_id is null
    or exists (select 1 from public.startups s where s.id = startup_id and s.user_id = auth.uid())
  )
);
