-- Made during the XRP LEDGER HACKATHON
-- Messages: direct messages, message requests, Send GLXY in chat, and
-- blocking. Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

-- Direct messages between citizens, with Send GLXY in chat and blocking.
-- Friends, family, and mutual follows message each other directly; anyone else
-- starts a message request the recipient can accept or decline (replying also
-- accepts). Messages are private to the two members (RLS) but are not
-- end-to-end encrypted. All writes go through SECURITY DEFINER functions.

-- ---------------------------------------------------------------- blocking --
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
-- A member sees only whom they blocked, never who blocked them.
drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks for select using (auth.uid() = blocker_id);

-- Whether either member has blocked the other. Internal (not callable by
-- members, so it can't be used to probe who blocked you).
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $ib$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$ib$;
revoke all on function public.is_blocked(uuid, uuid) from public, anon, authenticated;

-- ----------------------------------------------------------- conversations --
-- One conversation per pair (user_a < user_b). status 'request' means the
-- member in requested_by is waiting for the other to accept.
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references auth.users (id) on delete cascade,
  user_b          uuid not null references auth.users (id) on delete cascade,
  status          text not null default 'active' check (status in ('active', 'request')),
  requested_by    uuid references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  a_read_at       timestamptz,
  b_read_at       timestamptz,
  constraint conversations_ordered check (user_a < user_b),
  unique (user_a, user_b)
);
create index if not exists conversations_user_b_idx on public.conversations (user_b);
alter table public.conversations enable row level security;
drop policy if exists "conversations_select_member" on public.conversations;
create policy "conversations_select_member" on public.conversations for select using (
  auth.uid() in (user_a, user_b)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references auth.users (id) on delete cascade,
  body            text,
  glxy_amount     numeric(20, 2), -- set when the message carries a GLXY payment
  created_at      timestamptz not null default now(),
  constraint messages_has_content check (coalesce(length(body), 0) > 0 or glxy_amount is not null)
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member" on public.messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)
  )
);

-- Friends, family, and mutual follows can message each other directly.
create or replace function public.can_message_directly(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $cm$
  select public.is_connected(a, b, 'friend')
      or public.is_connected(a, b, 'family')
      or (exists (select 1 from public.follows where follower_id = a and followee_id = b)
          and exists (select 1 from public.follows where follower_id = b and followee_id = a));
$cm$;

-- Find or start the conversation from uid to p_to. A new conversation is a
-- request unless the pair can message directly; a pending request becomes
-- active when the recipient replies or the pair becomes connected. Internal.
create or replace function public._open_conversation(uid uuid, p_to uuid)
returns public.conversations language plpgsql security definer set search_path = public as $fn$
declare
  c public.conversations; ua uuid := least(uid, p_to); ub uuid := greatest(uid, p_to);
  direct boolean;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_to is null or p_to = uid then raise exception 'You cannot message yourself'; end if;
  if not exists (select 1 from auth.users where id = p_to) then raise exception 'Member not found'; end if;
  if public.is_blocked(uid, p_to) then raise exception 'You can''t message this member'; end if;
  direct := public.can_message_directly(uid, p_to);

  select * into c from public.conversations where user_a = ua and user_b = ub for update;
  if not found then
    insert into public.conversations (user_a, user_b, status, requested_by)
      values (ua, ub, case when direct then 'active' else 'request' end,
              case when direct then null else uid end)
      on conflict (user_a, user_b) do nothing
      returning * into c;
    if c.id is null then -- created concurrently
      select * into c from public.conversations where user_a = ua and user_b = ub for update;
    end if;
  elsif c.status = 'request' and (c.requested_by <> uid or direct) then
    update public.conversations set status = 'active', requested_by = null
      where id = c.id returning * into c;
  end if;
  return c;
end; $fn$;
revoke all on function public._open_conversation(uuid, uuid) from public, anon, authenticated;

-- Record a new message on the conversation and mark it read for the sender.
create or replace function public._touch_conversation(c public.conversations, uid uuid)
returns void language sql security definer set search_path = public as $fn$
  update public.conversations
    set last_message_at = now(),
        a_read_at = case when c.user_a = uid then now() else a_read_at end,
        b_read_at = case when c.user_b = uid then now() else b_read_at end
    where id = c.id;
$fn$;
revoke all on function public._touch_conversation(public.conversations, uuid) from public, anon, authenticated;

create or replace function public.send_message(p_to uuid, p_body text)
returns public.messages language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); body text := trim(coalesce(p_body, '')); c public.conversations; m public.messages;
begin
  if body = '' then raise exception 'Write a message first'; end if;
  if length(body) > 4000 then raise exception 'Messages can be at most 4,000 characters'; end if;
  c := public._open_conversation(uid, p_to);
  -- A pending request is capped so strangers can't flood an inbox.
  if c.status = 'request' and (
    select count(*) from public.messages where conversation_id = c.id and sender_id = uid
  ) >= 5 then
    raise exception 'You can send up to 5 messages until they accept your request';
  end if;
  insert into public.messages (conversation_id, sender_id, body)
    values (c.id, uid, body) returning * into m;
  perform public._touch_conversation(c, uid);
  return m;
end; $fn$;

-- Send GLXY to the other member inside a conversation (with an optional note).
-- Available once the conversation is active (not while a request is pending).
create or replace function public.send_glxy_message(p_to uuid, p_amount numeric, p_note text)
returns public.messages language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); amt numeric(20,2) := round(p_amount, 2);
  note text := nullif(trim(coalesce(p_note, '')), '');
  c public.conversations; m public.messages; bal numeric(20,2);
  sender_name text; recipient_name text;
begin
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  if note is not null and length(note) > 500 then raise exception 'Notes can be at most 500 characters'; end if;
  c := public._open_conversation(uid, p_to);
  if c.status = 'request' then
    raise exception 'You can send GLXY once they accept your message request';
  end if;

  select balance into bal from public.wallets where user_id = uid for update;
  if bal is null then raise exception 'You have no wallet yet'; end if;
  if bal < amt then raise exception 'Not enough spendable GLXY'; end if;

  select coalesce('@' || username, display_name, 'a member') into sender_name from public.profiles where id = uid;
  select coalesce('@' || username, display_name, 'a member') into recipient_name from public.profiles where id = p_to;

  insert into public.wallets (user_id, balance) values (p_to, 0) on conflict (user_id) do nothing;
  update public.wallets set balance = balance - amt where user_id = uid;
  update public.wallets set balance = balance + amt where user_id = p_to;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -amt, 'transfer_out', 'To ' || coalesce(recipient_name, 'a member') || ' · Messages');
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (p_to, amt, 'transfer_in', 'From ' || coalesce(sender_name, 'a member') || ' · Messages');

  insert into public.messages (conversation_id, sender_id, body, glxy_amount)
    values (c.id, uid, note, amt) returning * into m;
  perform public._touch_conversation(c, uid);
  return m;
end; $fn$;

-- The recipient of a message request accepts it, or declines (deleting it).
create or replace function public.respond_message_request(p_conversation uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); c public.conversations;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into c from public.conversations where id = p_conversation for update;
  if not found or uid not in (c.user_a, c.user_b) or c.status <> 'request' or c.requested_by = uid then
    raise exception 'This message request is no longer pending';
  end if;
  if p_accept then
    update public.conversations set status = 'active', requested_by = null where id = c.id;
  else
    delete from public.conversations where id = c.id;
  end if;
end; $fn$;

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language sql security definer set search_path = public as $fn$
  update public.conversations
    set a_read_at = case when user_a = auth.uid() then now() else a_read_at end,
        b_read_at = case when user_b = auth.uid() then now() else b_read_at end
    where id = p_conversation and auth.uid() in (user_a, user_b);
$fn$;

-- Delete your own text message for both members. Payment messages stay, since
-- the GLXY has already moved.
create or replace function public.delete_message(p_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare n integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.messages where id = p_id and sender_id = auth.uid() and glxy_amount is null;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Only your own text messages can be deleted'; end if;
end; $fn$;

-- Conversations with unread messages from the other member (for the header
-- badge), optionally excluding the conversation with p_exclude (open chat).
create or replace function public.unread_message_count(p_exclude uuid default null)
returns integer language sql stable security definer set search_path = public as $fn$
  select count(*)::integer from public.conversations c
  where auth.uid() in (c.user_a, c.user_b)
    and (p_exclude is null or p_exclude not in (c.user_a, c.user_b))
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id in (c.user_a, c.user_b)
    )
    and exists (
      select 1 from public.messages m
      where m.conversation_id = c.id and m.sender_id <> auth.uid()
        and m.created_at > coalesce(
          case when c.user_a = auth.uid() then c.a_read_at else c.b_read_at end,
          '-infinity'::timestamptz)
    );
$fn$;

-- Block: stops messages, follows, and friend/family requests both ways, and
-- removes existing follows, connections, and any pending message request.
create or replace function public.block_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_target is null or p_target = uid then raise exception 'You cannot block yourself'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (uid, p_target) on conflict do nothing;
  delete from public.follows
    where (follower_id = uid and followee_id = p_target) or (follower_id = p_target and followee_id = uid);
  delete from public.notifications where connection_id in (
    select id from public.connections
    where least(requester_id, addressee_id) = least(uid, p_target)
      and greatest(requester_id, addressee_id) = greatest(uid, p_target));
  delete from public.connections
    where least(requester_id, addressee_id) = least(uid, p_target)
      and greatest(requester_id, addressee_id) = greatest(uid, p_target);
  delete from public.conversations
    where user_a = least(uid, p_target) and user_b = greatest(uid, p_target) and status = 'request';
end; $fn$;

create or replace function public.unblock_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.blocks where blocker_id = auth.uid() and blocked_id = p_target;
end; $fn$;

revoke all on function public.can_message_directly(uuid, uuid) from public, anon;
revoke all on function public.send_message(uuid, text) from public, anon;
revoke all on function public.send_glxy_message(uuid, numeric, text) from public, anon;
revoke all on function public.respond_message_request(uuid, boolean) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.delete_message(uuid) from public, anon;
revoke all on function public.unread_message_count(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.can_message_directly(uuid, uuid) to authenticated;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.send_glxy_message(uuid, numeric, text) to authenticated;
grant execute on function public.respond_message_request(uuid, boolean) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;
grant execute on function public.unread_message_count(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;

-- Live delivery: stream new messages and conversation changes over Supabase
-- Realtime (still filtered by the RLS policies above).
do $rt$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
      alter publication supabase_realtime add table public.conversations;
    end if;
  end if;
end $rt$;

-- ------------------------------------------- blocks apply to People too --
-- (Same as 0020, plus the is_blocked check.)
create or replace function public.follow_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); n integer;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_target is null or p_target = uid then raise exception 'You cannot follow yourself'; end if;
  if public.is_blocked(uid, p_target) then raise exception 'You can''t follow this member'; end if;
  insert into public.follows (follower_id, followee_id) values (uid, p_target)
    on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    -- Replace any earlier follow notice so follow/unfollow toggling can't spam.
    delete from public.notifications where user_id = p_target and actor_id = uid and kind = 'follow';
    insert into public.notifications (user_id, actor_id, kind) values (p_target, uid, 'follow');
  end if;
end; $fn$;

create or replace function public.request_connection(p_target uuid, p_kind text)
returns public.connections language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); c public.connections;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_kind not in ('friend', 'family') then raise exception 'Unknown connection type'; end if;
  if p_target is null or p_target = uid then raise exception 'You cannot connect with yourself'; end if;
  if public.is_blocked(uid, p_target) then raise exception 'You can''t connect with this member'; end if;
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
