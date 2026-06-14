import { deletePost, deleteComment } from "./actions";
import { type ReactionSummary } from "./reactions";
import ReactionBar from "./ReactionBar";
import CommentForm from "./CommentForm";

export type FeedComment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  authorName: string;
  reactions: ReactionSummary;
};

export type FeedPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  authorName: string;
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
          <p className="text-sm font-semibold text-white">{post.authorName}</p>
          <p className="text-xs text-white/40">{formatWhen(post.created_at)}</p>
        </div>
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
                    <span className="text-xs font-semibold text-white/90">
                      {c.authorName}
                    </span>
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
