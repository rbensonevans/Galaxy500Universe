-- Social feed for the Life page: posts, comments, and emoji reactions.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- This script is idempotent: it is safe to run more than once.

-- ----------------------------------------------------------------------------
-- Posts
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  content    text,
  image_url  text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- The feed is shared: any signed-in member can read all posts.
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select
  using (auth.uid() is not null);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select
  using (auth.uid() is not null);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Reactions (an emoji "like" on exactly one post OR one comment)
-- ----------------------------------------------------------------------------
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  post_id    uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  constraint reactions_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

-- A member may apply a given emoji to a given target at most once.
create unique index if not exists reactions_unique_post
  on public.reactions (user_id, post_id, emoji) where post_id is not null;
create unique index if not exists reactions_unique_comment
  on public.reactions (user_id, comment_id, emoji) where comment_id is not null;

alter table public.reactions enable row level security;

drop policy if exists "reactions_select_all" on public.reactions;
create policy "reactions_select_all" on public.reactions for select
  using (auth.uid() is not null);

drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Let signed-in members read each other's profiles (to show post authors).
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select
  using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- Storage bucket for post images (publicly readable URLs).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

-- Storage policies require ownership of storage.objects, which the SQL Editor
-- role may not have. Run them best-effort so a permission error here does NOT
-- roll back the tables created above. If this block is skipped, add the same
-- policies via Dashboard -> Storage -> post-images -> Policies.
do $do$
begin
  execute $p$drop policy if exists "post_images_read" on storage.objects$p$;
  execute $p$create policy "post_images_read" on storage.objects for select
    using (bucket_id = 'post-images')$p$;

  execute $p$drop policy if exists "post_images_insert" on storage.objects$p$;
  execute $p$create policy "post_images_insert" on storage.objects for insert
    with check (bucket_id = 'post-images'
      and auth.uid()::text = (storage.foldername(name))[1])$p$;

  execute $p$drop policy if exists "post_images_delete" on storage.objects$p$;
  execute $p$create policy "post_images_delete" on storage.objects for delete
    using (bucket_id = 'post-images'
      and auth.uid()::text = (storage.foldername(name))[1])$p$;
exception
  when others then
    raise notice 'Skipped storage.objects policies (%). Add them via Dashboard -> Storage -> Policies if image upload fails.', sqlerrm;
end
$do$;

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists reactions_post_idx on public.reactions (post_id);
create index if not exists reactions_comment_idx on public.reactions (comment_id);
