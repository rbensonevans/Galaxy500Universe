"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Grants the one-time 1000 GLXY welcome bonus (creates the member's wallet).
// The actual balance change happens in a SECURITY DEFINER SQL function so it
// can't be forged from the client.
export async function claimWelcomeBonus() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_welcome_bonus");
  if (!error) {
    revalidatePath("/life/wallet");
  }
}
