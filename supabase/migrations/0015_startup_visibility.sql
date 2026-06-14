-- Public/private flag for startups. Private startups are hidden from the Stock
-- Exchange and cannot be traded. See FINANCIAL_MODEL.md.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.startups add column if not exists is_public boolean not null default true;

-- Exclude private startups from the exchange snapshot.
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

-- Block trading of private startups (buy side; sell allows unwinding either way
-- is fine, but we also guard buys here).
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
revoke all on function public.buy_shares(uuid, numeric) from public;
grant execute on function public.buy_shares(uuid, numeric) to authenticated;
