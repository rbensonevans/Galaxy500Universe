"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  // Upsert: creates the profile row on first save, updates it thereafter.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: clean(formData.get("display_name")),
      bio: clean(formData.get("bio")),
      location: clean(formData.get("location")),
      website: clean(formData.get("website")),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/life/profile");
  revalidatePath("/life");
  return { success: "Profile saved." };
}
