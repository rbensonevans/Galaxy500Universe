-- Seed the currency reserve (iglobecreator) with a vast issuance pool:
-- 100 trillion GLXY, representing the wealth backing a huge population.
-- See FINANCIAL_MODEL.md. Run in Supabase SQL Editor. Idempotent (guarded).
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

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

create or replace function public.reserve_pool() returns numeric language sql security definer set search_path = public stable as $rp$
  select coalesce((select w.balance from public.wallets w
    join public.system_accounts sa on sa.user_id = w.user_id
    where sa.role = 'currency_reserve' limit 1), 0);
$rp$;
revoke all on function public.reserve_pool() from public;
grant execute on function public.reserve_pool() to authenticated;
