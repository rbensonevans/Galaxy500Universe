"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EMOJIS } from "./reactions";

export type PostState = {
  error?: string;
  success?: boolean;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Feeds backed by the shared posts/comments/reactions tables, and the pages
// that render them.
const FEED_PATHS: Record<string, string> = {
  life: "/life",
  family: "/life/friends-family",
  travel: "/life/travel",
};
const ALLOWED_FEEDS = Object.keys(FEED_PATHS);

// A mutation can affect a post in any feed, so refresh every feed page.
function revalidateFeeds() {
  for (const path of Object.values(FEED_PATHS)) revalidatePath(path);
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
  const feedRaw = String(formData.get("feed") ?? "life");
  const feed = ALLOWED_FEEDS.includes(feedRaw) ? feedRaw : "life";
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;

  if (!content && !hasImage) {
    return { error: "Write something or add an image." };
  }

  let imageUrl: string | null = null;

  if (hasImage) {
    const file = image as File;
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files can be attached." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Images must be 5 MB or smaller." };
    }

    const ext = file.name.includes(".")
      ? file.name.split(".").pop()
      : "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    imageUrl = supabase.storage.from("post-images").getPublicUrl(path)
      .data.publicUrl;
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    content: content || null,
    image_url: imageUrl,
    feed,
  });

  if (error) return { error: error.message };

  revalidatePath(FEED_PATHS[feed]);
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
