-- Profile photos. Each citizen can upload one photo, shown on their profile
-- and in the header (it links to the profile). Photos are resized in the
-- browser to 512x512 before upload and stored in a public `avatars` bucket at
-- <user id>/<uuid>.<ext>; only the owner can add or remove files in their
-- folder. profiles.avatar_path holds the current photo's storage path.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.profiles add column if not exists avatar_path text;

-- The path must be a file in the citizen's own folder, so a profile can't
-- point at another citizen's photo (or anything else).
alter table public.profiles drop constraint if exists profiles_avatar_path_own;
alter table public.profiles add constraint profiles_avatar_path_own check (
  avatar_path is null
  or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('avatars', 'avatars', true, 2097152,
          array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set
    public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Best-effort like the other storage policies: a failure here will NOT roll
-- back the rest of the script.
do $do$
begin
  execute $p$drop policy if exists "avatars_read" on storage.objects$p$;
  execute $p$create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars')$p$;
  execute $p$drop policy if exists "avatars_insert" on storage.objects$p$;
  execute $p$create policy "avatars_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])$p$;
  execute $p$drop policy if exists "avatars_delete" on storage.objects$p$;
  execute $p$create policy "avatars_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])$p$;
exception when others then
  raise notice 'Skipped avatars storage policies (%). Add via Dashboard -> Storage -> Policies if needed.', sqlerrm;
end
$do$;
