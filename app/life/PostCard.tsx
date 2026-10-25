import Link from "next/link";
import { deletePost, deleteComment } from "./actions";
import { followUser } from "./people/actions";
import { type ReactionSummary } from "./reactions";
import ReactionBar from "./ReactionBar";
import CommentForm from "./CommentForm";

export type FeedComment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  authorName: string;
  /** Link to the author's profile. */
  authorHref?: string;
  reactions: ReactionSummary;
};

export type FeedPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  authorName: string;
  /** Link to the author's profile (omitted for company-labeled posts). */
  authorHref?: string;
  /** Show a Follow button (another member the viewer doesn't follow yet). */
  canFollow?: boolean;
  /** Where the post came from (shown on the Universal Feed). */
  source?: string;
  /** Personal-feed visibility; undefined for Startup Feed posts. */
  visibility?: "public" | "private" | "friends" | "family";
  reactions: ReactionSummary;
  comments: FeedComment[];
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-sm font-bold text-white">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

const VISIBILITY_LABELS = {
  public: "Universal",
  friends: "Friends",
  family: "Family",
  private: "Only you",
};

// Author name, linked to their profile when a link is available.
function AuthorName({
  name,
  href,
  className,
}: {
  name: string;
  href?: string;
  className: string;
}) {
  return href ? (
    <Link href={href} className={`${className} hover:text-violet-200`}>
      {name}
    </Link>
  ) : (
    <span className={className}>{name}</span>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <header className="flex items-center gap-3">
        <Avatar name={post.authorName} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AuthorName
              name={post.authorName}
              href={post.authorHref}
              className="text-sm font-semibold text-white"
            />
            {post.canFollow && (
              <form action={followUser}>
                <input type="hidden" name="target" value={post.user_id} />
                <button
                  type="submit"
                  className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-100 transition hover:bg-violet-500/30"
                >
                  + Follow
                </button>
              </form>
            )}
          </div>
          <p className="text-xs text-white/40">
            {formatWhen(post.created_at)}
            {post.source && <> · in {post.source}</>}
          </p>
        </div>
        {post.user_id === currentUserId && post.visibility && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              post.visibility === "public"
                ? "bg-cyan-500/15 text-cyan-200"
                : post.visibility === "private"
                  ? "bg-white/10 text-white/50"
                  : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {VISIBILITY_LABELS[post.visibility]}
          </span>
        )}
        {post.user_id === currentUserId && (
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              aria-label="Delete post"
              className="rounded-md px-2 py-1 text-xs text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              Delete
            </button>
          </form>
        )}
      </header>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap text-white/85">{post.content}</p>
      )}

      {post.image_url && (
        // User-uploaded images of arbitrary dimensions — plain img avoids
        // forcing a fixed aspect ratio / remote-image config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt=""
          className="mt-3 max-h-[28rem] w-full rounded-xl border border-white/10 object-cover"
        />
      )}

      <div className="mt-4">
        <ReactionBar
          targetType="post"
          targetId={post.id}
          summary={post.reactions}
        />
      </div>

      {/* Comments */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex flex-col gap-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.authorName} />
              <div className="flex-1">
                <div className="rounded-2xl bg-black/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <AuthorName
                      name={c.authorName}
                      href={c.authorHref}
                      className="text-xs font-semibold text-white/90"
                    />
                    <span className="text-[10px] text-white/30">
                      {formatWhen(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-white/80">
                    {c.content}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <ReactionBar
                    targetType="comment"
                    targetId={c.id}
                    summary={c.reactions}
                  />
                  {c.user_id === currentUserId && (
                    <form action={deleteComment}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-xs text-white/30 transition hover:text-rose-300"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <CommentForm postId={post.id} />
      </div>
    </article>
  );
}
