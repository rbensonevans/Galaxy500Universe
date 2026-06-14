"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Mints the member's 1,000,000 GLXY birth grant (creates their wallet). The
// balance change happens in a SECURITY DEFINER SQL function so it can't be
// forged, and it skips system/reserve accounts.
export async function claimBirthGrant() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_birth_grant");
  if (!error) {
    revalidatePath("/life/wallet");
  }
}
