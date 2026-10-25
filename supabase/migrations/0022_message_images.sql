-- Made during the XRP LEDGER HACKATHON
-- Images in direct messages (private 'message-images' bucket, members-only
-- signed URLs). Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

-- Images in direct messages: a message can carry an image stored in the
-- private 'message-images' bucket at '<sender id>/<uuid>.<ext>'. Images can be
-- sent once a conversation is active (not in a pending message request).
alter table public.messages add column if not exists image_path text;
alter table public.messages drop constraint if exists messages_has_content;
alter table public.messages add constraint messages_has_content check (
  coalesce(length(body), 0) > 0 or glxy_amount is not null or image_path is not null
);
create index if not exists messages_image_path_idx on public.messages (image_path)
  where image_path is not null;

-- Whether the caller may view a message image: it is attached to a message in
-- one of their conversations. Used by the storage read policy.
create or replace function public.can_view_message_image(p_name text)
returns boolean language sql stable security definer set search_path = public as $cv$
  select exists (
    select 1 from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.image_path = p_name and auth.uid() in (c.user_a, c.user_b)
  );
$cv$;
revoke all on function public.can_view_message_image(text) from public, anon;
grant execute on function public.can_view_message_image(text) to authenticated;

drop function if exists public.send_message(uuid, text);
create or replace function public.send_message(p_to uuid, p_body text, p_image_path text default null)
returns public.messages language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); body text := trim(coalesce(p_body, ''));
  img text := nullif(trim(coalesce(p_image_path, '')), '');
  c public.conversations; m public.messages;
begin
  if body = '' and img is null then raise exception 'Write a message first'; end if;
  if length(body) > 4000 then raise exception 'Messages can be at most 4,000 characters'; end if;
  -- Images must be the sender's own upload.
  if img is not null and img !~ ('^' || uid::text || '/[0-9a-f-]{36}\.(png|jpg|gif|webp)$') then
    raise exception 'Invalid image';
  end if;
  c := public._open_conversation(uid, p_to);
  if c.status = 'request' and img is not null then
    raise exception 'You can send images once they accept your message request';
  end if;
  -- A pending request is capped so strangers can't flood an inbox.
  if c.status = 'request' and (
    select count(*) from public.messages where conversation_id = c.id and sender_id = uid
  ) >= 5 then
    raise exception 'You can send up to 5 messages until they accept your request';
  end if;
  insert into public.messages (conversation_id, sender_id, body, image_path)
    values (c.id, uid, nullif(body, ''), img) returning * into m;
  perform public._touch_conversation(c, uid);
  return m;
end; $fn$;
revoke all on function public.send_message(uuid, text, text) from public, anon;
grant execute on function public.send_message(uuid, text, text) to authenticated;

-- Delete your own text or image message for both members (payment messages
-- stay). Returns the image path, if any, so the app can remove the file.
drop function if exists public.delete_message(uuid);
create or replace function public.delete_message(p_id uuid)
returns text language plpgsql security definer set search_path = public as $fn$
declare img text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.messages
    where id = p_id and sender_id = auth.uid() and glxy_amount is null
    returning image_path into img;
  if not found then raise exception 'Only your own text and image messages can be deleted'; end if;
  return img;
end; $fn$;
revoke all on function public.delete_message(uuid) from public, anon;
grant execute on function public.delete_message(uuid) to authenticated;

-- Private bucket for message images (5 MB, common image types). Read access
-- only for the two members of the conversation (signed URLs); uploads and
-- deletes only within the member's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('message-images', 'message-images', false, 5242880,
          array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
  on conflict (id) do update set
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Best-effort like the post-images policies above: a failure here will NOT
-- roll back the rest of the script.
do $do$
begin
  execute $p$drop policy if exists "message_images_read" on storage.objects$p$;
  execute $p$create policy "message_images_read" on storage.objects for select using (bucket_id = 'message-images' and (auth.uid()::text = (storage.foldername(name))[1] or public.can_view_message_image(name)))$p$;
  execute $p$drop policy if exists "message_images_insert" on storage.objects$p$;
  execute $p$create policy "message_images_insert" on storage.objects for insert with check (bucket_id = 'message-images' and auth.uid()::text = (storage.foldername(name))[1])$p$;
  execute $p$drop policy if exists "message_images_delete" on storage.objects$p$;
  execute $p$create policy "message_images_delete" on storage.objects for delete using (bucket_id = 'message-images' and auth.uid()::text = (storage.foldername(name))[1])$p$;
exception when others then
  raise notice 'Skipped message-images storage policies (%). Add via Dashboard -> Storage -> Policies if needed.', sqlerrm;
end
$do$;
