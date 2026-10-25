import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { type ReactionSummary } from "./reactions";
import Composer from "./Composer";
import PostCard, { type FeedPost, type FeedComment } from "./PostCard";
import { SECTIONS, MORE_SECTIONS } from "./sections";
import { profileHref } from "./people/relations";

// Made during the XRP LEDGER HACKATHON
// Display names for the feed streams, used to label where a post came from on
// the Universal Feed.
const FEED_NAMES = new Map<string, string>([
  ["life", "Life"],
  ...[...SECTIONS, ...MORE_SECTIONS].map((s) => [s.slug, s.name] as [string, string]),
]);

type ReactionRow = {
  emoji: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
};

function summarize(
  rows: { emoji: string; user_id: string }[],
  me: string,
): ReactionSummary {
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  for (const r of rows) {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    if (r.user_id === me) mine.add(r.emoji);
  }
  return { counts, mine, total: rows.length };
}

// Append `value` to the list stored at `key`, creating the list if needed.
function group<T>(map: Map<string, T[]>, key: string, value: T) {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

// A complete social feed (composer + posts with comments and emoji reactions),
// scoped to a single `feed` stream. Shared by the Life, Friends, Family, and
// other feed pages. With `universal`, it instead shows every public post and
// every Startup Feed post across the universe (read-only); with `authorId`,
// every post by one member that the viewer may see (their profile). The page
// provides its own heading.
export default async function Feed({
  feed,
  universal = false,
  authorId,
  startupId,
  canPost = true,
  postAuthorName,
  placeholder,
  emptyText = "No posts yet. Be the first to share something.",
}: {
  feed: string;
  /** Aggregate public + Startup Feed posts from every feed (no composer). */
  universal?: boolean;
  /** Show one member's posts across all feeds (no composer). */
  authorId?: string;
  /** When set, scope to a single startup's company feed instead of a stream. */
  startupId?: string;
  /** Whether to show the composer (e.g. only the company admin can post). */
  canPost?: boolean;
  /** Override the author label on posts (e.g. the company name). */
  postAuthorName?: string;
  placeholder?: string;
  emptyText?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const base = supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at, feed, startup_id, is_public");
  // Made during the XRP LEDGER HACKATHON
  // Visibility is enforced by RLS (own, public, Startup Feed, and Friends /
  // Family posts from accepted connections); these filters pick the stream.
  const { data: postRows, error } = await (universal
    ? base.or("is_public.eq.true,startup_id.not.is.null")
    : authorId
      ? base.eq("user_id", authorId)
      : startupId
        ? base.eq("startup_id", startupId)
        : base.eq("feed", feed)
  )
    .order("created_at", { ascending: false })
    .limit(50);

  const tableMissing = isMissingTableError(error);

  if (tableMissing) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        <p className="font-semibold">Database setup needed</p>
        <p className="mt-1 text-amber-100/80">
          The feed tables don&apos;t exist yet. In your Supabase dashboard, run{" "}
          <code className="rounded bg-black/30 px-1">supabase/SETUP.sql</code>{" "}
          (and{" "}
          <code className="rounded bg-black/30 px-1">
            supabase/migrations/0006_post_feed.sql
          </code>
          ).
        </p>
      </div>
    );
  }

  const posts = postRows ?? [];
  const postIds = posts.map((p) => p.id);

  const { data: commentRows } = postIds.length
    ? await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };
  const comments = commentRows ?? [];
  const commentIds = comments.map((c) => c.id);

  const [{ data: postReacts }, { data: commentReacts }] = await Promise.all([
    postIds.length
      ? supabase
          .from("reactions")
          .select("emoji, user_id, post_id, comment_id")
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as ReactionRow[] }),
    commentIds.length
      ? supabase
          .from("reactions")
          .select("emoji, user_id, post_id, comment_id")
          .in("comment_id", commentIds)
      : Promise.resolve({ data: [] as ReactionRow[] }),
  ]);

  const authorIds = Array.from(
    new Set([
      ...posts.map((p) => p.user_id),
      ...comments.map((c) => c.user_id),
    ]),
  );
  const { data: profileRows } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [] };
  const nameById = new Map<string, string>();
  for (const p of profileRows ?? []) {
    const displayName = p.display_name?.trim();
    if (displayName) nameById.set(p.id, displayName);
  }
  // Made during the XRP LEDGER HACKATHON
  // Authors the viewer follows: no Follow button, and a Universal Feed boost.
  const otherAuthors = authorIds.filter((id) => id !== me);
  const { data: followRows } = otherAuthors.length
    ? await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", me)
        .in("followee_id", otherAuthors)
    : { data: [] };
  const followed = new Set((followRows ?? []).map((f) => f.followee_id));

  const myFallback = user?.email?.split("@")[0] ?? "Galaxy member";
  const authorName = (id: string) =>
    nameById.get(id) ?? (id === me ? myFallback : "Galaxy member");

  // Made during the XRP LEDGER HACKATHON
  // Posts gathered from several feeds are labeled with where they came from,
  // and Startup Feed posts with the company.
  const aggregate = universal || Boolean(authorId);
  const startupIds = aggregate
    ? Array.from(new Set(posts.flatMap((p) => (p.startup_id ? [p.startup_id] : []))))
    : [];
  const { data: startupRows } = startupIds.length
    ? await supabase.from("startups").select("id, name").in("id", startupIds)
    : { data: [] };
  const startupName = new Map<string, string>(
    (startupRows ?? []).map((s) => [s.id, s.name]),
  );
  const sourceLabel = (p: (typeof posts)[number]) =>
    p.startup_id
      ? `${startupName.get(p.startup_id) ?? "Startup"} · Startup Feed`
      : (FEED_NAMES.get(p.feed) ?? p.feed);

  const reactsByPost = new Map<string, ReactionRow[]>();
  for (const r of (postReacts ?? []) as ReactionRow[]) {
    if (r.post_id) group(reactsByPost, r.post_id, r);
  }
  const reactsByComment = new Map<string, ReactionRow[]>();
  for (const r of (commentReacts ?? []) as ReactionRow[]) {
    if (r.comment_id) group(reactsByComment, r.comment_id, r);
  }

  const commentsByPost = new Map<string, FeedComment[]>();
  for (const c of comments) {
    group(commentsByPost, c.post_id, {
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      authorName: authorName(c.user_id),
      reactions: summarize(reactsByComment.get(c.id) ?? [], me),
      authorHref: profileHref(c.user_id, me),
    });
  }

  const items: FeedPost[] = posts.map((p) => ({
    id: p.id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at,
    user_id: p.user_id,
    authorName: postAuthorName ?? authorName(p.user_id),
    // A company-labeled post (Startup Feed page) links to no personal profile.
    authorHref: postAuthorName ? undefined : profileHref(p.user_id, me),
    canFollow: !postAuthorName && p.user_id !== me && !followed.has(p.user_id),
    source: aggregate ? sourceLabel(p) : undefined,
    visibility: p.startup_id
      ? undefined
      : p.is_public
        ? "public"
        : p.feed === "friends" || p.feed === "family"
          ? p.feed
          : "private",
    reactions: summarize(reactsByPost.get(p.id) ?? [], me),
    comments: commentsByPost.get(p.id) ?? [],
  }));

  // Made during the XRP LEDGER HACKATHON
  // Universal Feed ranking, a first interest signal: posts by members you
  // follow get a 24-hour boost over strictly newest-first ordering.
  if (universal) {
    const BOOST_MS = 24 * 60 * 60 * 1000;
    const score = (p: FeedPost) =>
      new Date(p.created_at).getTime() + (followed.has(p.user_id) ? BOOST_MS : 0);
    items.sort((a, b) => score(b) - score(a));
  }

  return (
    <>
      {canPost && !aggregate && (
        <div className="mt-6">
          <Composer feed={feed} startupId={startupId} placeholder={placeholder} />
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          Couldn&apos;t load the feed: {error.message}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
            {emptyText}
          </div>
        ) : (
          items.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={me} />
          ))
        )}
      </div>
    </>
  );
}
