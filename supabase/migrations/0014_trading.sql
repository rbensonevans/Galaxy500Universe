-- Phase 3 of the financial model: engagement-driven share pricing and
-- GLXY <-> shares trading with the universe as market maker.
-- See FINANCIAL_MODEL.md. Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

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
  from public.startups s;
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

