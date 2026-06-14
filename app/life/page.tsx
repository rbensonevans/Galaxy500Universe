import { createClient } from "@/lib/supabase/server";
import { type ReactionSummary } from "./reactions";
import Composer from "./Composer";
import PostCard, { type FeedPost, type FeedComment } from "./PostCard";

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

export default async function LifePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;
  const greetingName = user?.email?.split("@")[0] ?? "traveler";

  const { data: postRows, error } = await supabase
    .from("posts")
    .select("id, user_id, content, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const tableMissing =
    error?.code === "42P01" ||
    error?.message?.toLowerCase().includes("does not exist");

  const posts = postRows ?? [];
  const postIds = posts.map((p) => p.id);

  // Comments for the visible posts.
  const { data: commentRows } = postIds.length
    ? await supabase
        .from("comments")
        .select("id, post_id, user_id, content, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };
  const comments = commentRows ?? [];
  const commentIds = comments.map((c) => c.id);

  // Reactions for posts and comments (fetched separately, then merged).
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

  // Author display names.
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
  const nameById = new Map<string, string>(
    (profileRows ?? []).map((p) => [
      p.id,
      p.display_name?.trim() || "Galaxy member",
    ]),
  );
  const authorName = (id: string) => nameById.get(id) ?? "Galaxy member";

  // Group reactions by target.
  const reactsByPost = new Map<string, ReactionRow[]>();
  for (const r of (postReacts ?? []) as ReactionRow[]) {
    if (r.post_id) group(reactsByPost, r.post_id, r);
  }
  const reactsByComment = new Map<string, ReactionRow[]>();
  for (const r of (commentReacts ?? []) as ReactionRow[]) {
    if (r.comment_id) group(reactsByComment, r.comment_id, r);
  }

  // Group comments by post.
  const commentsByPost = new Map<string, FeedComment[]>();
  for (const c of comments) {
    group(commentsByPost, c.post_id, {
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      authorName: authorName(c.user_id),
      reactions: summarize(reactsByComment.get(c.id) ?? [], me),
    });
  }

  const feed: FeedPost[] = posts.map((p) => ({
    id: p.id,
    content: p.content,
    image_url: p.image_url,
    created_at: p.created_at,
    user_id: p.user_id,
    authorName: authorName(p.user_id),
    reactions: summarize(reactsByPost.get(p.id) ?? [], me),
    comments: commentsByPost.get(p.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Life
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Welcome back, <span className="capitalize">{greetingName}</span>
      </h1>
      <p className="mt-2 text-white/60">Share what&apos;s happening in your universe.</p>

      {tableMissing ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            The feed tables don&apos;t exist yet. In your Supabase dashboard,
            open the SQL Editor and run the migration at{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0003_feed.sql
            </code>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Composer />
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-100">
              Couldn&apos;t load the feed: {error.message}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-5">
            {feed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
                No posts yet. Be the first to share something.
              </div>
            ) : (
              feed.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={me} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
