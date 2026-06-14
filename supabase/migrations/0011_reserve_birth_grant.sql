-- Phase 1 of the financial model: the Galaxy Reserve and the 1,000,000 GLXY
-- birth grant. See FINANCIAL_MODEL.md.
-- Run in Supabase SQL Editor. Idempotent and spend-safe.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

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

insert into public.wallets (user_id, balance)
  select user_id, 0 from public.system_accounts where role = 'currency_reserve'
  on conflict (user_id) do nothing;

create or replace function public.ensure_birth_grant()
returns public.wallets language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); w public.wallets; reserve uuid; handle text;
  grant_amt numeric(20,2) := 1000000;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select lower(username) into handle from public.profiles where id = uid;
  if exists (select 1 from public.system_accounts where user_id = uid)
     or handle in ('iglobecreator','iglobeshares') then
    insert into public.wallets (user_id, balance) values (uid, 0) on conflict (user_id) do nothing;
    select * into w from public.wallets where user_id = uid; return w;
  end if;
  select * into w from public.wallets where user_id = uid;
  if found then return w; end if;
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
      and not exists (select 1 from public.wallet_transactions t
        where t.user_id = w.user_id and t.kind in ('birth_grant','birth_grant_topup'));
  insert into public.wallet_transactions (user_id, amount, kind, memo)
    select user_id, delta, 'birth_grant_topup', 'Birth grant adjustment to 1,000,000'
    from _eligible where delta > 0;
  select coalesce(sum(delta),0) into total from _eligible;
  update public.wallets set balance = 1000000 where user_id in (select user_id from _eligible);
  update public.wallets set balance = balance - total where user_id = reserve;
end $birth$;

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
