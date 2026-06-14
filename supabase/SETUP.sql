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
alter table public.profiles add column if not exists username text;
-- Unique handle (case-insensitive); multiple NULLs allowed until set.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username)) where username is not null;
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
  feed       text not null default 'life',
  created_at timestamptz not null default now()
);
alter table public.posts add column if not exists feed text not null default 'life';
-- Company "Startup Feed" posts are scoped to a startup; only its owner may post.
alter table public.posts add column if not exists startup_id uuid references public.startups (id) on delete cascade;
create index if not exists posts_feed_created_idx on public.posts (feed, created_at desc);
create index if not exists posts_startup_created_idx on public.posts (startup_id, created_at desc);
alter table public.posts enable row level security;
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (auth.uid() is not null);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (
  auth.uid() = user_id
  and (
    startup_id is null
    or exists (select 1 from public.startups s where s.id = startup_id and s.user_id = auth.uid())
  )
);
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

-- Transfer spendable GLXY to another member by their @handle (username).
create or replace function public.transfer_credits(recipient_handle text, amount numeric)
returns numeric language plpgsql security definer set search_path = public as $fn$
declare
  uid    uuid := auth.uid();
  amt    numeric(20,2) := round(amount, 2);
  handle text := ltrim(lower(trim(coalesce(recipient_handle, ''))), '@');
  rid    uuid;
  sender_handle text;
  sbal   numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  if handle = '' then raise exception 'Enter a recipient handle'; end if;

  select id into rid from public.profiles where lower(username) = handle;
  if rid is null then raise exception 'No member with handle @%', handle; end if;
  if rid = uid then raise exception 'You cannot transfer to yourself'; end if;

  select balance into sbal from public.wallets where user_id = uid for update;
  if sbal is null then raise exception 'You have no wallet yet'; end if;
  if sbal < amt then raise exception 'Not enough spendable GLXY'; end if;

  insert into public.wallets (user_id, balance) values (rid, 0) on conflict (user_id) do nothing;
  select username into sender_handle from public.profiles where id = uid;

  update public.wallets set balance = balance - amt where user_id = uid;
  update public.wallets set balance = balance + amt where user_id = rid;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -amt, 'transfer_out', 'To @' || handle);
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (rid, amt, 'transfer_in', 'From @' || coalesce(sender_handle, 'a member'));

  select balance into sbal from public.wallets where user_id = uid;
  return sbal;
end; $fn$;
revoke all on function public.transfer_credits(text, numeric) from public;
grant execute on function public.transfer_credits(text, numeric) to authenticated;

-- ============================ CRYPTO BANK (GLXY accounts) ==================
-- Checking (0% APY, daily transactions), Savings (5%), Money Market (10%,
-- stock-related investing). Retain old savings_* columns only as a migration
-- source for any pre-existing savings balance.
alter table public.wallets add column if not exists savings_balance    numeric(20, 2) not null default 0;
alter table public.wallets add column if not exists savings_rate       numeric(6, 4)  not null default 0.0500;
alter table public.wallets add column if not exists savings_accrued_at timestamptz    not null default now();

create table if not exists public.bank_accounts (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('checking','savings','money_market')),
  balance    numeric(20, 2) not null default 0,
  rate       numeric(6, 4) not null default 0,
  accrued_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.bank_accounts enable row level security;
drop policy if exists "bank_accounts_select_own" on public.bank_accounts;
create policy "bank_accounts_select_own" on public.bank_accounts for select using (auth.uid() = user_id);

create table if not exists public.bank_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  account    text not null default 'savings',
  amount     numeric(20, 2) not null,
  kind       text not null,
  created_at timestamptz not null default now()
);
alter table public.bank_transactions add column if not exists account text not null default 'savings';
alter table public.bank_transactions enable row level security;
drop policy if exists "bank_tx_select_own" on public.bank_transactions;
create policy "bank_tx_select_own" on public.bank_transactions for select using (auth.uid() = user_id);
create index if not exists bank_tx_user_idx on public.bank_transactions (user_id, created_at desc);

create or replace function public._bank_default_rate(kind text) returns numeric language sql immutable as $rate$
  select case kind when 'savings' then 0.0500 when 'money_market' then 0.1000 else 0.0000 end::numeric;
$rate$;
revoke all on function public._bank_default_rate(text) from public;

-- Seed accounts for existing wallets, migrating any prior savings balance.
insert into public.bank_accounts (user_id, kind, balance, rate, accrued_at)
  select user_id, 'savings', savings_balance, 0.0500, coalesce(savings_accrued_at, now()) from public.wallets
  on conflict (user_id, kind) do nothing;
insert into public.bank_accounts (user_id, kind, balance, rate)
  select user_id, 'checking', 0, 0.0000 from public.wallets on conflict (user_id, kind) do nothing;
insert into public.bank_accounts (user_id, kind, balance, rate)
  select user_id, 'money_market', 0, 0.1000 from public.wallets on conflict (user_id, kind) do nothing;

create or replace function public.bank_account_accrue(account text)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; pending numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  insert into public.bank_accounts (user_id, kind, rate) values (uid, account, public._bank_default_rate(account))
    on conflict (user_id, kind) do nothing;
  select * into a from public.bank_accounts where user_id = uid and kind = account for update;
  pending := round(a.balance * a.rate * (extract(epoch from (now() - a.accrued_at)) / 31536000.0), 2);
  if pending > 0 then
    update public.bank_accounts set balance = balance + pending, accrued_at = now()
      where user_id = uid and kind = account returning * into a;
    insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, pending, 'interest');
  end if;
  return a;
end; $fn$;

create or replace function public.bank_account_deposit(account text, amount numeric)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; amt numeric(20,2) := round(amount,2); bal numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_account_accrue(account);
  select balance into bal from public.wallets where user_id = uid for update;
  if bal is null then raise exception 'No wallet yet'; end if;
  if bal < amt then raise exception 'Not enough spendable GLXY'; end if;
  update public.wallets set balance = balance - amt where user_id = uid;
  update public.bank_accounts set balance = balance + amt where user_id = uid and kind = account returning * into a;
  insert into public.wallet_transactions (user_id, amount, kind, memo) values (uid, -amt, 'bank_deposit', 'Deposit to ' || account);
  insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, amt, 'deposit');
  return a;
end; $fn$;

create or replace function public.bank_account_withdraw(account text, amount numeric)
returns public.bank_accounts language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); a public.bank_accounts; amt numeric(20,2) := round(amount,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if account not in ('checking','savings','money_market') then raise exception 'Unknown account'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  perform public.bank_account_accrue(account);
  select * into a from public.bank_accounts where user_id = uid and kind = account for update;
  if a.balance < amt then raise exception 'Not enough in that account'; end if;
  update public.bank_accounts set balance = balance - amt where user_id = uid and kind = account returning * into a;
  update public.wallets set balance = balance + amt where user_id = uid;
  insert into public.wallet_transactions (user_id, amount, kind, memo) values (uid, amt, 'bank_withdraw', 'Withdrawal from ' || account);
  insert into public.bank_transactions (user_id, account, amount, kind) values (uid, account, -amt, 'withdraw');
  return a;
end; $fn$;

-- Remove superseded single-savings functions.
drop function if exists public.bank_deposit(numeric);
drop function if exists public.bank_withdraw(numeric);
drop function if exists public.bank_accrue_interest();

revoke all on function public.bank_account_accrue(text) from public;
revoke all on function public.bank_account_deposit(text, numeric) from public;
revoke all on function public.bank_account_withdraw(text, numeric) from public;
grant execute on function public.bank_account_accrue(text) to authenticated;
grant execute on function public.bank_account_deposit(text, numeric) to authenticated;
grant execute on function public.bank_account_withdraw(text, numeric) to authenticated;

-- ============================ RESERVE & BIRTH GRANT ========================
-- System/reserve accounts. Registered by handle so they are excluded from the
-- birth grant and from money-supply totals.
create table if not exists public.system_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    text not null
);
alter table public.system_accounts enable row level security;
drop policy if exists "system_accounts_select" on public.system_accounts;
create policy "system_accounts_select" on public.system_accounts for select using (auth.uid() is not null);

insert into public.system_accounts (user_id, role)
  select id, 'currency_reserve' from public.profiles where lower(username) = 'iglobecreator'
  on conflict (user_id) do update set role = excluded.role;
insert into public.system_accounts (user_id, role)
  select id, 'shares_reserve' from public.profiles where lower(username) = 'iglobeshares'
  on conflict (user_id) do update set role = excluded.role;

-- Initialize the currency reserve wallet (its balance trends negative as it
-- issues birth grants; money supply is computed separately).
insert into public.wallets (user_id, balance)
  select user_id, 0 from public.system_accounts where role = 'currency_reserve'
  on conflict (user_id) do nothing;

-- Birth grant: a new member is "born" with 1,000,000 GLXY, minted from the
-- currency reserve. System accounts never receive it. Idempotent per member.
create or replace function public.ensure_birth_grant()
returns public.wallets language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid();
  w public.wallets;
  reserve uuid;
  handle text;
  grant_amt numeric(20,2) := 1000000;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select lower(username) into handle from public.profiles where id = uid;
  if exists (select 1 from public.system_accounts where user_id = uid)
     or handle in ('iglobecreator','iglobeshares') then
    insert into public.wallets (user_id, balance) values (uid, 0) on conflict (user_id) do nothing;
    select * into w from public.wallets where user_id = uid;
    return w;
  end if;
  select * into w from public.wallets where user_id = uid;
  if found then return w; end if; -- already born
  insert into public.wallets (user_id, balance) values (uid, grant_amt) returning * into w;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, grant_amt, 'birth_grant', 'Birth grant — welcome to Galaxy500Universe');
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  if reserve is not null then
    update public.wallets set balance = balance - grant_amt where user_id = reserve;
  end if;
  return w;
end; $fn$;
revoke all on function public.ensure_birth_grant() from public;
grant execute on function public.ensure_birth_grant() to authenticated;

drop function if exists public.claim_welcome_bonus();

-- One-time: bring existing members (who never received a birth grant) up to
-- 1,000,000. Guarded by the absence of a birth-grant tx, so it is safe to
-- re-run and never refunds spending.
do $birth$
declare reserve uuid; total numeric(20,2);
begin
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  if reserve is null then return; end if;

  create temporary table _eligible on commit drop as
    select w.user_id, (1000000 - w.balance) as delta
    from public.wallets w
    where w.user_id not in (select user_id from public.system_accounts)
      and w.balance < 1000000
      and not exists (
        select 1 from public.wallet_transactions t
        where t.user_id = w.user_id and t.kind in ('birth_grant','birth_grant_topup')
      );

  insert into public.wallet_transactions (user_id, amount, kind, memo)
    select user_id, delta, 'birth_grant_topup', 'Birth grant adjustment to 1,000,000'
    from _eligible where delta > 0;

  select coalesce(sum(delta),0) into total from _eligible;
  update public.wallets set balance = 1000000 where user_id in (select user_id from _eligible);
  update public.wallets set balance = balance - total where user_id = reserve;
end $birth$;

-- Computed economy stats (members only; system accounts excluded).
create or replace function public.money_supply() returns numeric language sql security definer set search_path = public stable as $ms$
  select coalesce((select sum(balance) from public.wallets w where w.user_id not in (select user_id from public.system_accounts)),0)
       + coalesce((select sum(balance) from public.bank_accounts a where a.user_id not in (select user_id from public.system_accounts)),0);
$ms$;
create or replace function public.population() returns bigint language sql security definer set search_path = public stable as $pop$
  select count(*)::bigint from public.wallets w where w.user_id not in (select user_id from public.system_accounts);
$pop$;
revoke all on function public.money_supply() from public;
revoke all on function public.population() from public;
grant execute on function public.money_supply() to authenticated;
grant execute on function public.population() to authenticated;

-- ============================ VERIFY =======================================
-- The result of this run should list all tables.
select tablename from pg_tables where schemaname = 'public' order by tablename;
