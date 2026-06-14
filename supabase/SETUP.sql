-- Galaxy500Universe — one-shot database setup.
-- Paste this ENTIRE file into the Supabase SQL Editor and click Run.
-- It creates every table in the correct order and finishes by listing them.
-- Safe to run more than once.

-- ============================ STARTUPS =====================================
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
alter table public.startups enable row level security;
-- Readable by any signed-in member (they are listed on the Stock Exchange).
drop policy if exists "startups_select_all" on public.startups;
create policy "startups_select_all" on public.startups for select using (auth.uid() is not null);
drop policy if exists "startups_insert_own" on public.startups;
create policy "startups_insert_own" on public.startups for insert with check (auth.uid() = user_id);
drop policy if exists "startups_update_own" on public.startups;
create policy "startups_update_own" on public.startups for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "startups_delete_own" on public.startups;
create policy "startups_delete_own" on public.startups for delete using (auth.uid() = user_id);

-- ============================ PROFILES =====================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio          text,
  location     text,
  website      text,
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (auth.uid() is not null);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================ POSTS ========================================
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content    text,
  image_url  text,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (auth.uid() is not null);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = user_id);

-- ============================ COMMENTS =====================================
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (auth.uid() is not null);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- ============================ REACTIONS ====================================
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  post_id    uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  constraint reactions_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);
create unique index if not exists reactions_unique_post on public.reactions (user_id, post_id, emoji) where post_id is not null;
create unique index if not exists reactions_unique_comment on public.reactions (user_id, comment_id, emoji) where comment_id is not null;
alter table public.reactions enable row level security;
drop policy if exists "reactions_select_all" on public.reactions;
create policy "reactions_select_all" on public.reactions for select using (auth.uid() is not null);
drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions for insert with check (auth.uid() = user_id);
drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions for delete using (auth.uid() = user_id);

-- ============================ STORAGE ======================================
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

-- Storage policies need ownership of storage.objects (the SQL Editor role may
-- lack it). Best-effort: a failure here will NOT roll back the tables above.
do $do$
begin
  execute $p$drop policy if exists "post_images_read" on storage.objects$p$;
  execute $p$create policy "post_images_read" on storage.objects for select using (bucket_id = 'post-images')$p$;
  execute $p$drop policy if exists "post_images_insert" on storage.objects$p$;
  execute $p$create policy "post_images_insert" on storage.objects for insert with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1])$p$;
  execute $p$drop policy if exists "post_images_delete" on storage.objects$p$;
  execute $p$create policy "post_images_delete" on storage.objects for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1])$p$;
exception when others then
  raise notice 'Skipped storage.objects policies (%). Add via Dashboard -> Storage -> Policies if needed.', sqlerrm;
end
$do$;

-- ============================ WALLET (Galaxy Credits) ======================
create table if not exists public.wallets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  balance    numeric(20, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own" on public.wallets for select using (auth.uid() = user_id);

create table if not exists public.wallet_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  amount     numeric(20, 2) not null,
  kind       text not null,
  memo       text,
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
drop policy if exists "wallet_tx_select_own" on public.wallet_transactions;
create policy "wallet_tx_select_own" on public.wallet_transactions for select using (auth.uid() = user_id);
create index if not exists wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);

create or replace function public.claim_welcome_bonus()
returns public.wallets
language plpgsql security definer set search_path = public
as $fn$
declare uid uuid := auth.uid(); w public.wallets;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into w from public.wallets where user_id = uid;
  if found then return w; end if;
  insert into public.wallets (user_id, balance) values (uid, 1000) returning * into w;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, 1000, 'welcome_bonus', 'Welcome to Galaxy500Universe');
  return w;
end;
$fn$;
revoke all on function public.claim_welcome_bonus() from public;
grant execute on function public.claim_welcome_bonus() to authenticated;

-- ============================ VERIFY =======================================
-- The result of this run should list all tables.
select tablename from pg_tables where schemaname = 'public' order by tablename;
