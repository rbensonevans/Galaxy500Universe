"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_BUCKET, avatarPathPattern } from "@/lib/avatar";

export type ProfileState = {
  error?: string;
  success?: string;
};

function clean(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const username = clean(formData.get("username"));
  if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return {
      error: "Handle must be 3–20 letters, numbers, or underscores.",
    };
  }

  // Upsert: creates the profile row on first save, updates it thereafter.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name: clean(formData.get("display_name")),
      bio: clean(formData.get("bio")),
      location: clean(formData.get("location")),
      website: clean(formData.get("website")),
      discoverable: formData.get("discoverable") === "on", // Made during the XRP LEDGER HACKATHON
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (error.code === "23505") {
      return { error: "That handle is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/life/profile");
  revalidatePath("/life");
  return { success: "Profile saved." };
}

export type TransferState = {
  error?: string;
  success?: string;
};

// Send spendable GLXY to another member by their @handle. The balance move is
// performed by the SECURITY DEFINER transfer_credits() function.
export async function transferCredits(
  _prevState: TransferState,
  formData: FormData,
): Promise<TransferState> {
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .replace(/^@/, "");
  const amount = Number(formData.get("amount"));

  if (!handle) return { error: "Enter a recipient handle." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_credits", {
    recipient_handle: handle,
    amount,
  });

  if (error) return { error: error.message };

  revalidatePath("/life/profile");
  revalidatePath("/life/wallet");
  return {
    success: `Sent ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} GLXY to @${handle}.`,
  };
}

// Set (or, with null, remove) the citizen's profile photo. The browser has
// already uploaded the resized file to avatars/<user id>/…; this records it
// and deletes the previous photo.
export async function setAvatar(path: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (path !== null && !avatarPathPattern(user.id).test(path)) {
    return { error: "Invalid photo." };
  }

  const { data: current } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, avatar_path: path, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) {
    if (path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return { error: error.message };
  }

  const old = current?.avatar_path;
  if (old && old !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([old]);
  }

  revalidatePath("/life", "layout");
  return {};
}
