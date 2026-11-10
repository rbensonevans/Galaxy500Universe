import Link from "next/link";
import { EditableText, EditMenu, EditScope } from "./EditMenu";
import { followUser } from "./citizens/actions";
import { type ReactionSummary } from "./reactions";
import ReactionBar from "./ReactionBar";
import CommentForm from "./CommentForm";
import Avatar from "@/app/components/Avatar";
import YouTubeEmbed from "./YouTubeEmbed";
import { youtubeId } from "@/lib/youtube";
import type { Verification } from "@/lib/verification";

export type FeedComment = {
  id: string;
  content: string;
  created_at: string;
  /** When the author last edited the comment. */
  editedAt?: string | null;
  user_id: string;
  authorName: string;
  /** Author's profile photo path (null shows their initial). */
  authorAvatar?: string | null;
  /** Author's verification badge. */
  authorVerification?: Verification | null;
  /** Link to the author's profile. */
  authorHref?: string;
  reactions: ReactionSummary;
};

export type FeedPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  /** When the author last edited the caption. */
  editedAt?: string | null;
  /** YouTube title of the post's video, when known. */
  videoTitle?: string | null;
  created_at: string;
  user_id: string;
  authorName: string;
  /** Author's profile photo path (null shows their initial). */
  authorAvatar?: string | null;
  /** Author's verification badge. */
  authorVerification?: Verification | null;
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

// Made during the XRP LEDGER HACKATHON
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
  compact = false,
}: {
  post: FeedPost;
  currentUserId: string;
  /** Grid card (WeTube Universal): video first, short caption, comments folded. */
  compact?: boolean;
}) {
  const videoId = youtubeId(post.content);
  // A YouTube link anywhere in the post plays inline (any feed).
  const videoMedia = videoId && (
    <>
      <YouTubeEmbed id={videoId} />
      {post.videoTitle && (
        <p className="mt-2 text-sm font-medium text-white/80">{post.videoTitle}</p>
      )}
    </>
  );
  const commentsBlock = (
    <div className={compact ? "mt-3" : "mt-4 border-t border-white/10 pt-4"}>
      <div className="flex flex-col gap-3">
        {post.comments.map((c) => (
          <EditScope key={c.id}>
            <div className="flex gap-3">
              <Avatar path={c.authorAvatar} name={c.authorName} verification={c.authorVerification} />
              <div className="flex-1">
                <div className="rounded-2xl bg-black/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <AuthorName
                      name={c.authorName}
                      href={c.authorHref}
                      className="text-xs font-semibold text-white/90"
                    />
                    <span className="flex items-center gap-1 text-[10px] text-white/30">
                      {formatWhen(c.created_at)}
                      {c.editedAt && <> · edited</>}
                      {c.user_id === currentUserId && <EditMenu kind="comment" id={c.id} />}
                    </span>
                  </div>
                  <EditableText
                    kind="comment"
                    id={c.id}
                    text={c.content}
                    className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/80"
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <ReactionBar
                    targetType="comment"
                    targetId={c.id}
                    summary={c.reactions}
                  />
                </div>
              </div>
            </div>
          </EditScope>
        ))}
      </div>

      <CommentForm postId={post.id} />
    </div>
  );
  return (
    <EditScope>
      {/* Raised while its menu is open so the menu isn't hidden under the next post. */}
      <article className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md has-[[aria-expanded=true]]:z-10">
        <header className="flex items-center gap-3">
          <Avatar path={post.authorAvatar} name={post.authorName} verification={post.authorVerification} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <AuthorName
                name={post.authorName}
                href={post.authorHref}
                className="text-sm font-semibold text-white"
              />
              {/* Made during the XRP LEDGER HACKATHON */}
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
              {post.editedAt && <> · edited</>}
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
          {post.user_id === currentUserId && <EditMenu kind="post" id={post.id} />}
        </header>

        {/* Grid cards lead with the video; full cards lead with the caption. */}
        {compact && videoMedia}
        <EditableText
          kind="post"
          id={post.id}
          text={post.content}
          className={`mt-3 whitespace-pre-wrap break-words text-white/85 ${compact ? "line-clamp-3 text-sm" : ""}`}
        />

        {!compact && videoMedia}

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

        {/* Comments (folded on grid cards) */}
        {compact ? (
          <details className="mt-3 border-t border-white/10 pt-3">
            <summary className="cursor-pointer text-xs text-white/50 transition hover:text-white/80">
              Comments ({post.comments.length})
            </summary>
            {commentsBlock}
          </details>
        ) : (
          commentsBlock
        )}
      </article>
    </EditScope>
  );
}
