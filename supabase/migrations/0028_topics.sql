-- Topics on the Universal Feed (Topics tab). A public post is under a topic
-- when it mentions one of the topic's keywords (full-text search, so old posts
-- count too) or uses its hashtag (#soccer). Any hashtag also works as a topic
-- of its own, so citizens can start new topics just by using one.
-- Both lookups are indexed (GIN), so a topic view stays fast as posts grow.
-- Run in Supabase SQL Editor. Idempotent.
-- NOTE: prefer running supabase/SETUP.sql (single source of truth).

-- Hashtags in a post: #word at the start or after a space (not URL fragments),
-- lowercased, letters/digits/underscore, 2–50 characters.
create or replace function public.extract_hashtags(p_text text)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct lower(m[1])), '{}')
  from regexp_matches(coalesce(p_text, ''), '(?:^|\s)#([A-Za-z][A-Za-z0-9_]{1,49})', 'g') as m;
$$;

alter table public.posts add column if not exists hashtags text[]
  generated always as (public.extract_hashtags(content)) stored;
alter table public.posts add column if not exists search tsvector
  generated always as (
    to_tsvector('english'::regconfig, coalesce(content, '') || ' ' || coalesce(video_title, ''))
  ) stored;

create index if not exists posts_hashtags_idx on public.posts using gin (hashtags);
create index if not exists posts_search_idx on public.posts using gin (search);

-- The topic list. Citizens can read it; only the database (SQL Editor) edits
-- it for now. Keywords may be phrases ("premier league").
create table if not exists public.topics (
  slug       text primary key check (slug ~ '^[a-z][a-z0-9_]{1,49}$'),
  name       text not null,
  keywords   text[] not null default '{}',
  sort       int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.topics enable row level security;
drop policy if exists "topics_select" on public.topics;
create policy "topics_select" on public.topics for select using (auth.uid() is not null);

insert into public.topics (slug, name, keywords, sort) values
  ('soccer',     'Soccer',          '{soccer,fifa,"premier league","la liga","champions league",mls,"world cup"}', 10),
  ('marathons',  'Marathons',       '{marathon,"half marathon",ultramarathon,"boston marathon","new york city marathon"}', 20),
  ('track',      'Track & Field',   '{"track and field",sprint,hurdles,relay,"pole vault","long jump","high jump","shot put",decathlon}', 30),
  ('running',    'Running',         '{running,jogging,5k,10k,"trail running",parkrun}', 40),
  ('basketball', 'Basketball',      '{basketball,nba,wnba,"march madness"}', 50),
  ('football',   'American Football', '{nfl,"super bowl",touchdown,quarterback,"college football"}', 60),
  ('baseball',   'Baseball',        '{baseball,mlb,"world series","home run"}', 70),
  ('tennis',     'Tennis',          '{tennis,wimbledon,"french open","australian open","roland garros"}', 80),
  ('golf',       'Golf',            '{golf,pga,"masters tournament","ryder cup"}', 90),
  ('cycling',    'Cycling',         '{cycling,"tour de france",peloton,"mountain biking"}', 100),
  ('f1',         'Formula 1',       '{"formula 1",f1,"grand prix"}', 110),
  ('hiking',     'Hiking',          '{hiking,hike,trail,"national park"}', 120),
  ('jazz',       'Jazz',            '{jazz}', 130),
  ('hiphop',     'Hip-Hop',         '{"hip hop",hip-hop,rap,rapper}', 140),
  ('rock',       'Rock',            '{"rock music","rock band","classic rock"}', 150),
  ('ai',         'AI',              '{ai,"artificial intelligence","machine learning",llm,claude,chatgpt}', 160),
  ('crypto',     'Crypto',          '{crypto,bitcoin,ethereum,xrp,blockchain,defi}', 170),
  ('space',      'Space Exploration', '{nasa,spacex,rocket,mars,"space station",astronaut}', 180)
on conflict (slug) do update set
  name = excluded.name, keywords = excluded.keywords, sort = excluded.sort;

-- Public posts under a topic (keywords or hashtag), or under any hashtag.
-- SECURITY INVOKER: RLS still decides what the viewer may see.
create or replace function public.topic_posts(p_topic text)
returns setof public.posts language sql stable set search_path = '' as $$
  with t as (
    select websearch_to_tsquery('english'::regconfig, array_to_string(array(
      select case when k ~ '\s' then '"' || k || '"' else k end from unnest(keywords) as k
    ), ' or ')) as q
    from public.topics where slug = lower(p_topic)
  )
  select p.* from public.posts p
  where (p.is_public or p.startup_id is not null)
    and (p.hashtags @> array[lower(p_topic)] or p.search @@ (select q from t));
$$;
revoke all on function public.topic_posts(text) from public, anon;
grant execute on function public.topic_posts(text) to authenticated;

-- Most-used hashtags in recent public posts, for the Topics tab.
create or replace function public.trending_hashtags(p_days int default 30, p_limit int default 20)
returns table (tag text, posts bigint) language sql stable set search_path = '' as $$
  select h.tag, count(*) as posts
  from public.posts p, unnest(p.hashtags) as h(tag)
  where (p.is_public or p.startup_id is not null)
    and p.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
  group by h.tag
  order by posts desc, h.tag
  limit least(greatest(p_limit, 1), 50);
$$;
revoke all on function public.trending_hashtags(int, int) from public, anon;
grant execute on function public.trending_hashtags(int, int) to authenticated;
