-- Verification badges. Two levels, shown on a citizen's photo:
--   * Linked:   signed in with Google, LinkedIn or Facebook. Proves control of
--               that account, not that the person is real or unique.
--   * Verified: full verification (coming later). Only the database grants it
--               (SQL Editor or a SECURITY DEFINER function), never the citizen.
-- profiles.linked_providers is copied from auth.identities so other citizens
-- can see it (they can't read the auth schema). A trigger stops citizens from
-- writing either column through the API.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.profiles add column if not exists linked_providers text[] not null default '{}';
alter table public.profiles add column if not exists verified_at timestamptz;

-- The citizen's sign-in providers other than email, e.g. {google,linkedin_oidc}.
create or replace function public.linked_providers_of(p_user uuid)
returns text[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct i.provider order by i.provider), '{}')
  from auth.identities i
  where i.user_id = p_user and i.provider <> 'email';
$$;
revoke all on function public.linked_providers_of(uuid) from public, anon;
grant execute on function public.linked_providers_of(uuid) to authenticated;

-- SECURITY INVOKER on purpose: current_user is the API role ('authenticated'
-- or 'anon') for citizen writes, and the owner inside SECURITY DEFINER
-- functions and the SQL Editor, which may set these columns.
create or replace function public.profiles_guard_verification()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.verified_at := case when tg_op = 'UPDATE' then old.verified_at end;
    new.linked_providers := public.linked_providers_of(new.id);
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_verification on public.profiles;
create trigger profiles_guard_verification
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_verification();

-- Keep linked_providers current when a sign-in method is added or removed.
create or replace function public.sync_linked_providers()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles
    set linked_providers = public.linked_providers_of(v_user)
    where id = v_user;
  return null;
end $$;
revoke all on function public.sync_linked_providers() from public, anon, authenticated;

-- Best-effort: if the auth trigger can't be created, profiles still refresh
-- linked_providers whenever the citizen saves their profile or photo.
do $do$
begin
  execute 'drop trigger if exists sync_linked_providers on auth.identities';
  execute 'create trigger sync_linked_providers after insert or delete or update of provider on auth.identities for each row execute function public.sync_linked_providers()';
exception when others then
  raise notice 'Skipped auth.identities trigger (%).', sqlerrm;
end
$do$;

-- Backfill existing citizens (runs as the owner, so the guard lets it through).
update public.profiles p
  set linked_providers = public.linked_providers_of(p.id)
  where p.linked_providers is distinct from public.linked_providers_of(p.id);
