"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Made during the XRP LEDGER HACKATHON
// Creates the member's wallet if needed and pays every monthly grant owed
// (2,000 GLXY at birth, then on the 1st of each month). The balance change
// happens in a SECURITY DEFINER SQL function so it can't be forged, and it
// skips system/reserve accounts.
export async function receiveGrants() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_grants");
  if (!error) {
    revalidatePath("/life/wallet");
  }
}
