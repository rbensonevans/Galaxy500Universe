-- Videos in posts, for WeTube's Universal tab (every public video, newest
-- first, searchable by title or description).
--   * posts.video_id:    the first YouTube video linked in the post. Set by a
--                        trigger from the post text (same rules as
--                        lib/youtube.ts), so it always matches the link.
--   * posts.video_title: the video's YouTube title, looked up by the app when
--                        the post is created.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.posts add column if not exists video_id text;
alter table public.posts add column if not exists video_title text;

alter table public.posts drop constraint if exists posts_video_id_format;
alter table public.posts add constraint posts_video_id_format
  check (video_id is null or video_id ~ '^[A-Za-z0-9_-]{11}$');
alter table public.posts drop constraint if exists posts_video_title_length;
alter table public.posts add constraint posts_video_title_length
  check (video_title is null or char_length(video_title) <= 300);

create or replace function public.youtube_id(p_text text)
returns text language sql immutable set search_path = '' as $$
  select (regexp_match(
    p_text,
    'https?://(?:(?:www\.|m\.|music\.)?youtube\.com/(?:watch\?(?:[^\s#]*&)?v=|shorts/|live/|embed/)|youtu\.be/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])'
  ))[1];
$$;

create or replace function public.posts_set_video()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.video_id := public.youtube_id(new.content);
  if new.video_id is null then
    new.video_title := null;
  end if;
  return new;
end $$;

drop trigger if exists posts_set_video on public.posts;
create trigger posts_set_video
  before insert or update of content, video_title on public.posts
  for each row execute function public.posts_set_video();

-- Newest videos first, for the Universal tab.
create index if not exists posts_video_created_idx
  on public.posts (created_at desc) where video_id is not null;

-- Backfill video_id for posts made before this migration (titles are added
-- separately; see the PR notes).
update public.posts
  set video_id = public.youtube_id(content)
  where video_id is distinct from public.youtube_id(content);
