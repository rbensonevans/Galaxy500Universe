"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StartupState = {
  error?: string;
  success?: string;
};

function clean(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

export async function createStartup(
  _prevState: StartupState,
  formData: FormData,
): Promise<StartupState> {
  const name = clean(formData.get("name"));
  if (!name) {
    return { error: "A startup needs a name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase.from("startups").insert({
    user_id: user.id,
    name,
    tagline: clean(formData.get("tagline")),
    description: clean(formData.get("description")),
    website: clean(formData.get("website")),
    industry: clean(formData.get("industry")),
    // Defaults to public unless the founder unchecks "List on the exchange".
    is_public: formData.get("is_public") != null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/life/startups");
  redirect("/life/startups");
}

// Toggle a startup between public (listed/tradable) and private. RLS ensures a
// member can only update their own startup.
export async function setStartupVisibility(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const isPublic = String(formData.get("is_public")) === "true";

  const supabase = await createClient();
  await supabase.from("startups").update({ is_public: isPublic }).eq("id", id);
  revalidatePath("/life/startups");
  revalidatePath("/life/stockexchange");
}

export async function deleteStartup(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // RLS ensures a member can only delete their own startup.
  await supabase.from("startups").delete().eq("id", id);
  revalidatePath("/life/startups");
}
