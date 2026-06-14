-- Member-to-member GLXY transfers by unique @handle (username).
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username)) where username is not null;

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
