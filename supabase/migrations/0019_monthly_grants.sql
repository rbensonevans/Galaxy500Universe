-- Monthly Galaxy Credit grants replace the 1,000,000 GLXY lump-sum birth
-- grant, and existing citizens are reset onto the new scheme. See
-- FINANCIAL_MODEL.md §3. Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

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
