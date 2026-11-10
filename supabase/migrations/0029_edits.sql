-- Editing: citizens can edit their own comments and the caption of their own
-- posts. Edits go through these SECURITY DEFINER functions (there is still no
-- UPDATE policy), so only the text can change — never the feed, visibility,
-- image, author or date. edited_at shows an "edited" label.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

alter table public.posts add column if not exists edited_at timestamptz;
alter table public.comments add column if not exists edited_at timestamptz;

-- A post must keep a caption or an image. When the edit links a different
-- YouTube video, p_video_title (looked up by the app) replaces the title; the
-- posts_set_video trigger re-derives video_id from the new text.
create or replace function public.edit_post(p_id uuid, p_content text, p_video_title text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_post public.posts;
  v_content text := nullif(btrim(p_content), '');
begin
  select * into v_post from public.posts where id = p_id and user_id = auth.uid();
  if not found then
    raise exception 'Post not found';
  end if;
  if v_content is null and v_post.image_url is null then
    raise exception 'Write something or keep the image';
  end if;
  if v_content is not distinct from v_post.content then
    return;
  end if;
  update public.posts set
    content = v_content,
    video_title = case
      when public.youtube_id(v_content) is not distinct from v_post.video_id then v_post.video_title
      else left(btrim(p_video_title), 300)
    end,
    edited_at = now()
  where id = p_id;
end $$;

create or replace function public.edit_comment(p_id uuid, p_content text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
  v_content text := nullif(btrim(p_content), '');
begin
  select content into v_old from public.comments where id = p_id and user_id = auth.uid();
  if not found then
    raise exception 'Comment not found';
  end if;
  if v_content is null then
    raise exception 'Write a comment first';
  end if;
  if v_content = v_old then
    return;
  end if;
  update public.comments set content = v_content, edited_at = now() where id = p_id;
end $$;

revoke all on function public.edit_post(uuid, text, text) from public, anon;
revoke all on function public.edit_comment(uuid, text) from public, anon;
grant execute on function public.edit_post(uuid, text, text) to authenticated;
grant execute on function public.edit_comment(uuid, text) to authenticated;
