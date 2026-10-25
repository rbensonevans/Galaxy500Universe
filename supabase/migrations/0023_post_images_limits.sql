-- Enforce the 5 MB / common-image-type limit on the public post-images bucket
-- at the storage layer (post images now upload straight from the browser).
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('post-images', 'post-images', true, 5242880,
          array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
