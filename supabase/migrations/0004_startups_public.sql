-- Make startups readable by any signed-in member so they can be listed and
-- traded on the Galaxy500 Stock Exchange. Write access stays owner-only.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempotent: safe to run more than once.

drop policy if exists "startups_select_all" on public.startups;
create policy "startups_select_all" on public.startups for select
  using (auth.uid() is not null);
