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
-- Public startups are listed and tradable on the Stock Exchange; private ones
-- are hidden from the exchange and cannot be traded.
alter table public.startups add column if not exists is_public boolean not null default true;
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
-- Personal-feed posts the author shares publicly appear on the Universal Feed.
alter table public.posts add column if not exists is_public boolean not null default false;
alter table public.posts enable row level security;
-- Visibility: personal-feed posts (no startup_id) are owner-only unless the
-- author marks them public; Startup Feed posts (startup_id set) are visible to
-- any signed-in member so the community can engage (which drives share pricing).
drop policy if exists "posts_select_all" on public.posts;
drop policy if exists "posts_select_own" on public.posts;
drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select using (
  auth.uid() = user_id
  or (auth.uid() is not null and (startup_id is not null or is_public))
);
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

-- ============================ RESERVE & MONTHLY GRANTS =====================
-- System/reserve accounts. Registered by handle so they are excluded from the
-- monthly grants and from money-supply totals.
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

-- Initialize the currency reserve wallet (its balance is the issuance pool;
-- money supply is computed separately and excludes this account).
insert into public.wallets (user_id, balance)
  select user_id, 0 from public.system_accounts where role = 'currency_reserve'
  on conflict (user_id) do nothing;

-- One-time: seed the currency reserve with a vast issuance pool — 100 trillion
-- GLXY — representing the wealth backing a huge population. Guarded by a
-- 'reserve_seed' marker tx so re-running SETUP never resets it (which would
-- erase issuance accounting since the seed).
do $seed$
declare reserve uuid;
begin
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  if reserve is null then return; end if;
  if exists (select 1 from public.wallet_transactions where user_id = reserve and kind = 'reserve_seed') then
    return;
  end if;
  update public.wallets set balance = balance + 100000000000000 where user_id = reserve;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (reserve, 100000000000000, 'reserve_seed', 'Galaxy reserve funding pool');
end $seed$;

-- Monthly grants: from birth (account creation) each citizen receives 2,000
-- GLXY — the first at birth, then on the 1st of every month — minted from the
-- currency reserve. The guaranteed term is 600 months (50 years) = 1,200,000
-- GLXY; grants continue after that while the citizen is alive (grants_active),
-- with the post-50-year policy to be decided. System accounts never receive
-- grants. issued_grants tracks the total supplied to each citizen.
alter table public.wallets add column if not exists issued_grants numeric(20, 2) not null default 0;
alter table public.wallets add column if not exists grant_months  integer       not null default 0;
alter table public.wallets add column if not exists last_grant_at timestamptz;
alter table public.wallets add column if not exists grants_active boolean       not null default true;

-- Grants owed by `p_at` to a citizen born at `p_birth`: month 1 at birth, plus
-- one for every 1st of the month since (UTC).
create or replace function public._grant_months_due(p_birth timestamptz, p_at timestamptz)
returns integer language sql immutable as $due$
  select ((extract(year from p_at at time zone 'UTC') * 12 + extract(month from p_at at time zone 'UTC'))
        - (extract(year from p_birth at time zone 'UTC') * 12 + extract(month from p_birth at time zone 'UTC'))
        + 1)::integer;
$due$;

-- Pay every grant a citizen is owed (catch-up safe: never double-pays).
-- Internal — called by ensure_grants() and pay_monthly_grants() only.
create or replace function public._pay_grants(p_uid uuid)
returns integer language plpgsql security definer set search_path = public as $fn$
declare
  w public.wallets; birth timestamptz; due integer; owed integer; reserve uuid;
  grant_amt numeric(20,2) := 2000; term integer := 600; total numeric(20,2);
begin
  if exists (select 1 from public.system_accounts where user_id = p_uid) then return 0; end if;
  select * into w from public.wallets where user_id = p_uid for update;
  if not found or not w.grants_active then return 0; end if;
  select created_at into birth from auth.users where id = p_uid;
  birth := coalesce(birth, w.created_at);
  due := public._grant_months_due(birth, now());
  owed := due - w.grant_months;
  if owed <= 0 then return 0; end if;
  total := grant_amt * owed;

  -- One row per month; microsecond offsets keep the ledger in month order.
  insert into public.wallet_transactions (user_id, amount, kind, memo, created_at)
    select p_uid, grant_amt, 'monthly_grant',
      case when m = 1 then 'Birth grant — month 1 of ' || term
           when m <= term then 'Monthly grant — ' ||
             to_char(date_trunc('month', birth at time zone 'UTC') + make_interval(months => m - 1), 'Mon YYYY') ||
             ' (month ' || m || ' of ' || term || ')'
           else 'Monthly grant — ' ||
             to_char(date_trunc('month', birth at time zone 'UTC') + make_interval(months => m - 1), 'Mon YYYY') ||
             ' (month ' || m || ', beyond 50-year term)'
      end,
      now() + make_interval(secs => m / 1000000.0)
    from generate_series(w.grant_months + 1, due) as m;

  update public.wallets
    set balance = balance + total, issued_grants = issued_grants + total,
        grant_months = due, last_grant_at = now()
    where user_id = p_uid;
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  if reserve is not null then
    update public.wallets set balance = balance - total where user_id = reserve;
  end if;
  return owed;
end; $fn$;
revoke all on function public._pay_grants(uuid) from public, anon, authenticated;

-- Member-facing: create the caller's wallet if needed ("birth") and pay any
-- grants owed. Called on login, on Life page loads, and from the Wallet page.
create or replace function public.ensure_grants()
returns public.wallets language plpgsql security definer set search_path = public as $fn$
declare uid uuid := auth.uid(); w public.wallets;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  insert into public.wallets (user_id, balance) values (uid, 0) on conflict (user_id) do nothing;
  perform public._pay_grants(uid);
  select * into w from public.wallets where user_id = uid;
  return w;
end; $fn$;
revoke all on function public.ensure_grants() from public;
grant execute on function public.ensure_grants() to authenticated;

-- Retired 1,000,000 lump-sum grant; kept as an alias so older callers still work.
create or replace function public.ensure_birth_grant()
returns public.wallets language sql security definer set search_path = public as $fn$
  select public.ensure_grants();
$fn$;
revoke all on function public.ensure_birth_grant() from public;
grant execute on function public.ensure_birth_grant() to authenticated;

-- Scheduled: pay every active citizen on the 1st (see pg_cron job below).
create or replace function public.pay_monthly_grants()
returns integer language plpgsql security definer set search_path = public as $fn$
declare r record; paid integer := 0;
begin
  for r in select user_id from public.wallets
    where grants_active and user_id not in (select user_id from public.system_accounts)
  loop
    paid := paid + public._pay_grants(r.user_id);
  end loop;
  return paid;
end; $fn$;
revoke all on function public.pay_monthly_grants() from public, anon, authenticated;

drop function if exists public.claim_welcome_bonus();

-- One-time reset to the monthly scheme: return each citizen's old lump-sum
-- grant (welcome bonus, 1,000,000 birth grant, top-up) to the reserve — capped
-- at their wallet balance so no one goes negative — then pay the monthly
-- grants owed since birth. Guarded per citizen by a 'grant_reset' marker tx.
do $reset$
declare reserve uuid; r record; lump numeric(20,2); reclaim numeric(20,2);
begin
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  for r in
    select w.user_id, w.balance from public.wallets w
    where w.user_id not in (select user_id from public.system_accounts)
      and not exists (select 1 from public.wallet_transactions t
        where t.user_id = w.user_id and t.kind = 'grant_reset')
      and exists (select 1 from public.wallet_transactions t
        where t.user_id = w.user_id and t.kind in ('welcome_bonus','birth_grant','birth_grant_topup'))
  loop
    select coalesce(sum(amount), 0) into lump from public.wallet_transactions
      where user_id = r.user_id and kind in ('welcome_bonus','birth_grant','birth_grant_topup');
    reclaim := least(lump, greatest(r.balance, 0));
    update public.wallets
      set balance = balance - reclaim, issued_grants = 0, grant_months = 0
      where user_id = r.user_id;
    insert into public.wallet_transactions (user_id, amount, kind, memo)
      values (r.user_id, -reclaim, 'grant_reset',
        'Lump-sum birth grant returned to the reserve — moved to monthly grants');
    if reserve is not null then
      update public.wallets set balance = balance + reclaim where user_id = reserve;
    end if;
    perform public._pay_grants(r.user_id);
  end loop;
end $reset$;

-- Schedule the monthly payout for 00:00 UTC on the 1st. If pg_cron isn't
-- available, grants are still paid (catch-up) whenever a member visits.
do $cron$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('galaxy-monthly-grants', '0 0 1 * *', 'select public.pay_monthly_grants()');
exception when others then
  raise notice 'pg_cron unavailable (%); grants will be paid on member visits. Enable pg_cron under Database > Extensions and re-run to schedule.', sqlerrm;
end $cron$;

-- Computed economy stats (members only; system accounts excluded).
create or replace function public.money_supply() returns numeric language sql security definer set search_path = public stable as $ms$
  select coalesce((select sum(balance) from public.wallets w where w.user_id not in (select user_id from public.system_accounts)),0)
       + coalesce((select sum(balance) from public.bank_accounts a where a.user_id not in (select user_id from public.system_accounts)),0);
$ms$;
create or replace function public.population() returns bigint language sql security definer set search_path = public stable as $pop$
  select count(*)::bigint from public.wallets w where w.user_id not in (select user_id from public.system_accounts);
$pop$;
-- Remaining balance of the currency reserve issuance pool.
create or replace function public.reserve_pool() returns numeric language sql security definer set search_path = public stable as $rp$
  select coalesce((select w.balance from public.wallets w
    join public.system_accounts sa on sa.user_id = w.user_id
    where sa.role = 'currency_reserve' limit 1), 0);
$rp$;
revoke all on function public.money_supply() from public;
revoke all on function public.population() from public;
revoke all on function public.reserve_pool() from public;
grant execute on function public.money_supply() to authenticated;
grant execute on function public.population() to authenticated;
grant execute on function public.reserve_pool() to authenticated;

-- ============================ STARTUP FUNDING & EQUITY (Phase 2) ===========
-- The "shares reserve" (iglobeshares) is a pure system construct — no auth
-- user. Global pledged-share total lives in the reserves table.
create table if not exists public.reserves (
  name           text primary key,
  pledged_shares numeric(30, 4) not null default 0
);
insert into public.reserves (name, pledged_shares) values ('shares', 0)
  on conflict (name) do nothing;
alter table public.reserves enable row level security;
drop policy if exists "reserves_select" on public.reserves;
create policy "reserves_select" on public.reserves for select using (auth.uid() is not null);

-- Each startup has a fixed cap table; funding draws GLXY from the currency
-- reserve and pledges shares to the universe at funding_price (GLXY/share).
alter table public.startups add column if not exists total_shares        numeric(30,4) not null default 1000000;
alter table public.startups add column if not exists pledged_shares      numeric(30,4) not null default 0;
alter table public.startups add column if not exists outstanding_funding numeric(20,2) not null default 0;
alter table public.startups add column if not exists funding_price       numeric(20,4) not null default 1;
alter table public.startups add column if not exists last_funding_at     timestamptz;

create table if not exists public.startup_funding (
  id            uuid primary key default gen_random_uuid(),
  startup_id    uuid not null references public.startups (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  amount        numeric(20,2) not null,    -- + drawdown, - repayment
  kind          text not null,             -- initial | annual | repayment
  shares_pledged numeric(30,4) not null default 0, -- +pledged, -released
  created_at    timestamptz not null default now()
);
alter table public.startup_funding enable row level security;
drop policy if exists "startup_funding_select_own" on public.startup_funding;
create policy "startup_funding_select_own" on public.startup_funding for select using (
  exists (select 1 from public.startups s where s.id = startup_id and s.user_id = auth.uid())
);
create index if not exists startup_funding_idx on public.startup_funding (startup_id, created_at desc);

-- Request funding for a startup the caller owns. First draw is 'initial';
-- subsequent draws are 'annual' and require >= 365 days since the last draw.
create or replace function public.request_funding(p_startup uuid, p_amount numeric)
returns public.startups language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; amt numeric(20,2) := round(p_amount,2);
  reserve uuid; shares numeric(30,4); kind text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if s.user_id <> uid then raise exception 'Only the founder can request funding'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;

  if s.last_funding_at is null then
    kind := 'initial';
  else
    if now() - s.last_funding_at < interval '365 days' then
      raise exception 'Annual funding is available once per year. Next request after %',
        to_char(s.last_funding_at + interval '365 days', 'Mon DD, YYYY');
    end if;
    kind := 'annual';
  end if;

  shares := round(amt / nullif(s.funding_price,0), 4);
  if s.pledged_shares + shares > s.total_shares then
    raise exception 'Funding exceeds available equity (% shares remain)',
      to_char(s.total_shares - s.pledged_shares, 'FM999999999990.00');
  end if;

  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;

  insert into public.wallets (user_id, balance) values (uid, 0) on conflict (user_id) do nothing;
  update public.wallets set balance = balance + amt where user_id = uid;
  if reserve is not null then
    update public.wallets set balance = balance - amt where user_id = reserve;
  end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, amt, 'startup_funding', 'Funding for ' || s.name);

  update public.startups
    set pledged_shares = pledged_shares + shares,
        outstanding_funding = outstanding_funding + amt,
        last_funding_at = now()
    where id = p_startup returning * into s;
  update public.reserves set pledged_shares = pledged_shares + shares where name = 'shares';
  insert into public.startup_funding (startup_id, user_id, amount, kind, shares_pledged)
    values (p_startup, uid, amt, kind, shares);
  return s;
end; $fn$;

-- Repay funding: returns GLXY to the reserve and releases pledged shares.
create or replace function public.repay_funding(p_startup uuid, p_amount numeric)
returns public.startups language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; amt numeric(20,2) := round(p_amount,2);
  reserve uuid; shares numeric(30,4); bal numeric(20,2);
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if s.user_id <> uid then raise exception 'Only the founder can repay funding'; end if;
  if amt is null or amt <= 0 then raise exception 'Enter an amount greater than 0'; end if;
  if amt > s.outstanding_funding then raise exception 'Amount exceeds outstanding funding'; end if;

  select balance into bal from public.wallets where user_id = uid for update;
  if coalesce(bal,0) < amt then raise exception 'Not enough GLXY to repay'; end if;

  shares := round(amt / nullif(s.funding_price,0), 4);
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;

  update public.wallets set balance = balance - amt where user_id = uid;
  if reserve is not null then
    update public.wallets set balance = balance + amt where user_id = reserve;
  end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -amt, 'startup_repayment', 'Repayment for ' || s.name);

  update public.startups
    set pledged_shares = greatest(pledged_shares - shares, 0),
        outstanding_funding = outstanding_funding - amt
    where id = p_startup returning * into s;
  update public.reserves set pledged_shares = greatest(pledged_shares - shares, 0) where name = 'shares';
  insert into public.startup_funding (startup_id, user_id, amount, kind, shares_pledged)
    values (p_startup, uid, -amt, 'repayment', -shares);
  return s;
end; $fn$;

create or replace function public.total_pledged_shares() returns numeric language sql security definer set search_path = public stable as $tp$
  select coalesce((select pledged_shares from public.reserves where name = 'shares'), 0);
$tp$;

revoke all on function public.request_funding(uuid, numeric) from public;
revoke all on function public.repay_funding(uuid, numeric) from public;
revoke all on function public.total_pledged_shares() from public;
grant execute on function public.request_funding(uuid, numeric) to authenticated;
grant execute on function public.repay_funding(uuid, numeric) to authenticated;
grant execute on function public.total_pledged_shares() to authenticated;

-- ============================ TRADING & ENGAGEMENT PRICING (Phase 3) =======
-- Share prices are driven by REAL activity on each startup's feed: the
-- founder's posts plus OTHER members' comments and reactions (the founder's
-- own engagement is excluded so value must be earned, not self-pumped).
-- Members buy/sell shares for GLXY with the universe as market maker, at the
-- engagement-derived price. A startup is tradable once it has pledged shares
-- (i.e. has taken funding).

create table if not exists public.share_holdings (
  startup_id uuid not null references public.startups (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  shares     numeric(30,4) not null default 0,
  primary key (startup_id, user_id)
);
alter table public.share_holdings enable row level security;
drop policy if exists "share_holdings_select_own" on public.share_holdings;
create policy "share_holdings_select_own" on public.share_holdings for select using (auth.uid() = user_id);

-- Engagement score as of a point in time (founder's own engagement excluded).
create or replace function public.startup_score(p_startup uuid, p_asof timestamptz)
returns numeric language sql security definer set search_path = public stable as $sc$
  with owner as (select user_id from public.startups where id = p_startup),
  pids as (select id from public.posts where startup_id = p_startup and created_at <= p_asof),
  cmts as (
    select c.user_id from public.comments c
    where c.post_id in (select id from pids) and c.created_at <= p_asof
      and c.user_id <> (select user_id from owner)
  ),
  rcts as (
    select r.user_id from public.reactions r
    where r.post_id in (select id from pids) and r.created_at <= p_asof
      and r.user_id <> (select user_id from owner)
  )
  select
    (select count(*) from pids) * 1.0
  + (select count(*) from cmts) * 3.0
  + (select count(*) from rcts) * 1.0
  + (select count(distinct user_id) from (select user_id from cmts union select user_id from rcts) e) * 5.0;
$sc$;
revoke all on function public.startup_score(uuid, timestamptz) from public;
grant execute on function public.startup_score(uuid, timestamptz) to authenticated;

-- Engagement-driven spot price: base (funding_price) lifted by the score.
create or replace function public.startup_price(p_startup uuid)
returns numeric language sql security definer set search_path = public stable as $pr$
  select round(
    greatest(coalesce((select funding_price from public.startups where id = p_startup), 1), 1)
    * (1 + public.startup_score(p_startup, now()) / 100.0), 4);
$pr$;
revoke all on function public.startup_price(uuid) from public;
grant execute on function public.startup_price(uuid) to authenticated;

-- Per-startup market snapshot for the exchange (price, 24h change, score,
-- shares available to buy from the universe).
create or replace function public.startup_market()
returns table(startup_id uuid, price numeric, change_24h numeric, score numeric, available numeric, tradable boolean)
language sql security definer set search_path = public stable as $mk$
  select
    s.id,
    public.startup_price(s.id),
    case
      when greatest(s.funding_price,1) * (1 + public.startup_score(s.id, now() - interval '24 hours')/100.0) = 0 then 0
      else round((public.startup_price(s.id)
        / (greatest(s.funding_price,1) * (1 + public.startup_score(s.id, now() - interval '24 hours')/100.0)) - 1) * 100, 2)
    end,
    public.startup_score(s.id, now()),
    greatest(s.pledged_shares - coalesce((select sum(shares) from public.share_holdings h where h.startup_id = s.id), 0), 0),
    (s.pledged_shares > 0)
  from public.startups s
  where s.is_public;
$mk$;
revoke all on function public.startup_market() from public;
grant execute on function public.startup_market() to authenticated;

-- Buy shares from the universe at the current engagement price.
create or replace function public.buy_shares(p_startup uuid, p_qty numeric)
returns numeric language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; qty numeric(30,4) := round(p_qty,4);
  price numeric; cost numeric(20,2); member_total numeric; available numeric;
  bal numeric; reserve uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if qty is null or qty <= 0 then raise exception 'Enter a quantity greater than 0'; end if;
  if not s.is_public then raise exception 'This startup is private and not trading publicly'; end if;
  if s.pledged_shares <= 0 then raise exception 'Not tradable yet — this startup has no funded equity'; end if;

  select coalesce(sum(shares),0) into member_total from public.share_holdings where startup_id = p_startup;
  available := s.pledged_shares - member_total;
  if qty > available then raise exception 'Only % shares available', to_char(available,'FM999999999990.00'); end if;

  price := public.startup_price(p_startup);
  cost := round(qty * price, 2);
  select balance into bal from public.wallets where user_id = uid for update;
  if coalesce(bal,0) < cost then raise exception 'Not enough GLXY (need %)', to_char(cost,'FM999999999990.00'); end if;

  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;
  update public.wallets set balance = balance - cost where user_id = uid;
  if reserve is not null then update public.wallets set balance = balance + cost where user_id = reserve; end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, -cost, 'share_buy', 'Bought ' || to_char(qty,'FM999999999990.00') || ' ' || s.name || ' shares');
  insert into public.share_holdings (startup_id, user_id, shares) values (p_startup, uid, qty)
    on conflict (startup_id, user_id) do update set shares = public.share_holdings.shares + qty;
  return cost;
end; $fn$;

-- Sell shares back to the universe at the current engagement price.
create or replace function public.sell_shares(p_startup uuid, p_qty numeric)
returns numeric language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); s public.startups; qty numeric(30,4) := round(p_qty,4);
  price numeric; proceeds numeric(20,2); held numeric; reserve uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into s from public.startups where id = p_startup for update;
  if not found then raise exception 'Startup not found'; end if;
  if qty is null or qty <= 0 then raise exception 'Enter a quantity greater than 0'; end if;

  select shares into held from public.share_holdings where startup_id = p_startup and user_id = uid for update;
  if coalesce(held,0) < qty then raise exception 'You only hold % shares', to_char(coalesce(held,0),'FM999999999990.00'); end if;

  price := public.startup_price(p_startup);
  proceeds := round(qty * price, 2);
  select user_id into reserve from public.system_accounts where role = 'currency_reserve' limit 1;

  update public.share_holdings set shares = shares - qty where startup_id = p_startup and user_id = uid;
  delete from public.share_holdings where startup_id = p_startup and user_id = uid and shares <= 0;
  update public.wallets set balance = balance + proceeds where user_id = uid;
  if reserve is not null then update public.wallets set balance = balance - proceeds where user_id = reserve; end if;
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    values (uid, proceeds, 'share_sell', 'Sold ' || to_char(qty,'FM999999999990.00') || ' ' || s.name || ' shares');
  return proceeds;
end; $fn$;

revoke all on function public.buy_shares(uuid, numeric) from public;
revoke all on function public.sell_shares(uuid, numeric) from public;
grant execute on function public.buy_shares(uuid, numeric) to authenticated;
grant execute on function public.sell_shares(uuid, numeric) to authenticated;

-- ============================ VERIFY =======================================
-- The result of this run should list all tables.
select tablename from pg_tables where schemaname = 'public' order by tablename;
