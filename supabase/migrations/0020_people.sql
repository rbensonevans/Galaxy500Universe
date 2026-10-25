-- Made during the XRP LEDGER HACKATHON
-- People: discover and connect with other citizens (follows, friend/family
-- connections, notifications) and let accepted connections see each other's
-- Friends / Family feed posts. Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

-- Discover and connect with other citizens. Follows are one-way and need no
-- approval; connections (friend / family) are mutual and need the other
-- member to accept. Accepted connections can see each other's Friends /
-- Family feed posts. Every follow, request, and acceptance notifies the other
-- member. All writes go through SECURITY DEFINER functions.

-- Members can opt out of People search (their profile stays reachable from
-- their posts).
alter table public.profiles add column if not exists discoverable boolean not null default true;

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows for select using (auth.uid() is not null);

create table if not exists public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  kind         text not null check (kind in ('friend', 'family')),
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_not_self check (requester_id <> addressee_id)
);
-- One friend and one family connection per pair, whichever side asked.
create unique index if not exists connections_pair_kind_idx on public.connections
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id), kind);
create index if not exists connections_addressee_idx on public.connections (addressee_id, status);
alter table public.connections enable row level security;
-- Accepted connections are visible to members (friend counts/lists); pending
-- requests only to the two members involved.
drop policy if exists "connections_select" on public.connections;
create policy "connections_select" on public.connections for select using (
  auth.uid() in (requester_id, addressee_id)
  or (auth.uid() is not null and status = 'accepted')
);

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade, -- recipient
  actor_id      uuid not null references auth.users (id) on delete cascade,
  kind          text not null, -- follow | friend_request | friend_accept | family_request | family_accept
  connection_id uuid references public.connections (id) on delete set null,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = user_id);

-- Whether a and b have an accepted connection of the given kind.
create or replace function public.is_connected(a uuid, b uuid, p_kind text)
returns boolean language sql stable security definer set search_path = public as $ic$
  select exists (
    select 1 from public.connections
    where kind = p_kind and status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$ic$;

create or replace function public.follow_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); n integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_target is null or p_target = uid then raise exception 'You cannot follow yourself'; end if;
  insert into public.follows (follower_id, followee_id) values (uid, p_target)
    on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    -- Replace any earlier follow notice so follow/unfollow toggling can't spam.
    delete from public.notifications where user_id = p_target and actor_id = uid and kind = 'follow';
    insert into public.notifications (user_id, actor_id, kind) values (p_target, uid, 'follow');
  end if;
end; $fn$;

create or replace function public.unfollow_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.follows where follower_id = auth.uid() and followee_id = p_target;
end; $fn$;

-- Accept (p_accept) or decline a pending request addressed to the caller.
-- Declining deletes the request.
create or replace function public.respond_connection(p_id uuid, p_accept boolean)
returns public.connections language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); c public.connections;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into c from public.connections where id = p_id for update;
  if not found or c.addressee_id <> uid or c.status <> 'pending' then
    raise exception 'This request is no longer pending';
  end if;
  update public.notifications set read_at = coalesce(read_at, now())
    where connection_id = p_id and user_id = uid;
  if p_accept then
    update public.connections set status = 'accepted', responded_at = now()
      where id = p_id returning * into c;
    insert into public.notifications (user_id, actor_id, kind, connection_id)
      values (c.requester_id, uid, c.kind || '_accept', c.id);
  else
    delete from public.connections where id = p_id;
  end if;
  return c;
end; $fn$;

-- Send a friend/family request. If the other member already asked the caller,
-- this accepts their request instead.
create or replace function public.request_connection(p_target uuid, p_kind text)
returns public.connections language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); c public.connections;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_kind not in ('friend', 'family') then raise exception 'Unknown connection type'; end if;
  if p_target is null or p_target = uid then raise exception 'You cannot connect with yourself'; end if;
  select * into c from public.connections
    where kind = p_kind
      and least(requester_id, addressee_id) = least(uid, p_target)
      and greatest(requester_id, addressee_id) = greatest(uid, p_target)
    for update;
  if found then
    if c.status = 'pending' and c.addressee_id = uid then
      return public.respond_connection(c.id, true);
    end if;
    return c; -- already connected, or already requested by the caller
  end if;
  insert into public.connections (requester_id, addressee_id, kind)
    values (uid, p_target, p_kind) returning * into c;
  insert into public.notifications (user_id, actor_id, kind, connection_id)
    values (p_target, uid, p_kind || '_request', c.id);
  return c;
end; $fn$;

-- Cancel a sent request, or remove an accepted friend/family connection.
create or replace function public.remove_connection(p_target uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); cid uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select id into cid from public.connections
    where kind = p_kind
      and least(requester_id, addressee_id) = least(uid, p_target)
      and greatest(requester_id, addressee_id) = greatest(uid, p_target);
  if cid is null then return; end if;
  delete from public.notifications where connection_id = cid;
  delete from public.connections where id = cid;
end; $fn$;

create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = public as $fn$
  update public.notifications set read_at = now()
    where user_id = auth.uid() and read_at is null;
$fn$;

revoke all on function public.is_connected(uuid, uuid, text) from public, anon;
revoke all on function public.follow_user(uuid) from public, anon;
revoke all on function public.unfollow_user(uuid) from public, anon;
revoke all on function public.respond_connection(uuid, boolean) from public, anon;
revoke all on function public.request_connection(uuid, text) from public, anon;
revoke all on function public.remove_connection(uuid, text) from public, anon;
revoke all on function public.mark_notifications_read() from public, anon;
grant execute on function public.is_connected(uuid, uuid, text) to authenticated;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
grant execute on function public.respond_connection(uuid, boolean) to authenticated;
grant execute on function public.request_connection(uuid, text) to authenticated;
grant execute on function public.remove_connection(uuid, text) to authenticated;
grant execute on function public.mark_notifications_read() to authenticated;

-- Post visibility: own posts; public and Startup Feed posts for any member;
-- Friends / Family feed posts for the author's accepted friends / family.
drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_select_own" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select using (
  auth.uid() = user_id
  or (auth.uid() is not null and (startup_id is not null or is_public))
  or (feed = 'friends' and public.is_connected(auth.uid(), user_id, 'friend'))
  or (feed = 'family' and public.is_connected(auth.uid(), user_id, 'family'))
);
