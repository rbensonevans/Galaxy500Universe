-- Add a feed scope to posts so multiple social streams (Life, Friends & Family,
-- …) can share the same posts/comments/reactions infrastructure.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempotent: safe to run more than once.

alter table public.posts
  add column if not exists feed text not null default 'life';

create index if not exists posts_feed_created_idx
  on public.posts (feed, created_at desc);
