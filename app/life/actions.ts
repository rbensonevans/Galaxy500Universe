"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EMOJIS } from "./reactions";

export type PostState = {
  error?: string;
  success?: boolean;
};


// Feeds backed by the shared posts/comments/reactions tables, and the pages
// that render them.
const FEED_PATHS: Record<string, string> = {
  life: "/life",
  // Made during the XRP LEDGER HACKATHON
  friends: "/life/friends",
  family: "/life/family",
  movies: "/life/movies",
  music: "/life/music",
  sports: "/life/sports",
  travel: "/life/travel",
  communities: "/life/communities",
  gaming: "/life/gaming",
};
const ALLOWED_FEEDS = Object.keys(FEED_PATHS);

// Made during the XRP LEDGER HACKATHON
// The Universal Feed aggregates public and Startup Feed posts from every feed.
const UNIVERSAL_PATH = "/life/universe";

// A mutation can affect a post in any feed, so refresh every feed page, the
// Universal Feed, and all company "Startup Feed" pages (a dynamic route).
function revalidateFeeds() {
  for (const path of Object.values(FEED_PATHS)) revalidatePath(path);
  revalidatePath(UNIVERSAL_PATH);
  revalidatePath("/life/startups/[id]", "page");
}

export async function createPost(
  _prevState: PostState,
  formData: FormData,
): Promise<PostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const content = String(formData.get("content") ?? "").trim();
  const startupId = String(formData.get("startup_id") ?? "").trim() || null;
  const feedRaw = String(formData.get("feed") ?? "life");
  // Startup-scoped posts use the 'startup' feed; otherwise a known global feed.
  const feed = startupId
    ? "startup"
    : ALLOWED_FEEDS.includes(feedRaw)
      ? feedRaw
      : "life";
  // Made during the XRP LEDGER HACKATHON
  // Startup Feed posts are always visible to members; personal posts are
  // private unless the author shares them to the Universal Feed.
  const isPublic = !startupId && formData.get("is_public") === "on";
  // Made during the XRP LEDGER HACKATHON
  // The image (if any) was uploaded from the browser straight to the
  // post-images bucket (server actions cap request bodies at 1 MB); only its
  // path arrives here, and it must be in the poster's own folder.
  const imagePath = String(formData.get("image_path") ?? "") || null;
  if (
    imagePath &&
    !new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(png|jpg|gif|webp)$`).test(imagePath)
  ) {
    return { error: "Invalid image." };
  }

  if (!content && !imagePath) {
    return { error: "Write something or add an image." };
  }

  const imageUrl = imagePath
    ? supabase.storage.from("post-images").getPublicUrl(imagePath).data.publicUrl
    : null;

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    content: content || null,
    image_url: imageUrl,
    feed,
    startup_id: startupId,
    is_public: isPublic,
  });

  if (error) {
    // Don't leave an orphaned upload behind when the post is refused.
    if (imagePath) await supabase.storage.from("post-images").remove([imagePath]);
    return { error: error.message };
  }

  if (startupId) {
    revalidatePath(`/life/startups/${startupId}`);
  } else {
    revalidatePath(FEED_PATHS[feed]);
  }
  if (startupId || isPublic) revalidatePath(UNIVERSAL_PATH);
  return { success: true };
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id); // RLS: own only
  revalidateFeeds();
}

export type CommentState = {
  error?: string;
  success?: boolean;
};

export async function createComment(
  _prevState: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const postId = String(formData.get("post_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!postId) return { error: "Missing post." };
  if (!content) return { error: "Write a comment first." };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  revalidateFeeds();
  return { success: true };
}

export async function deleteComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", id); // RLS: own only
  revalidateFeeds();
}

// Toggle the current user's emoji reaction on a post or comment: if it already
// exists it is removed, otherwise it is added.
export async function toggleReaction(formData: FormData) {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const emoji = String(formData.get("emoji") ?? "");

  if (
    (targetType !== "post" && targetType !== "comment") ||
    !targetId ||
    !EMOJIS.includes(emoji as (typeof EMOJIS)[number])
  ) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const column = targetType === "post" ? "post_id" : "comment_id";

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq(column, targetId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("reactions").insert({
      user_id: user.id,
      [column]: targetId,
      emoji,
    });
  }

  revalidateFeeds();
}
