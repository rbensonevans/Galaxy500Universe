"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FundingState = {
  error?: string;
  success?: string;
};

function refresh(startupId: string) {
  revalidatePath(`/life/startups/${startupId}/funding`);
  revalidatePath("/life/startups");
  revalidatePath("/life/wallet");
}

// Request funding (initial or annual) or repay it, dispatched by hidden `op`.
// The balance/equity moves happen in SECURITY DEFINER SQL functions.
export async function fund(
  _prevState: FundingState,
  formData: FormData,
): Promise<FundingState> {
  const startupId = String(formData.get("startup_id") ?? "");
  const op = String(formData.get("op") ?? "request");
  const amount = Number(formData.get("amount"));

  if (!startupId) return { error: "Missing startup." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than 0." };
  }

  const supabase = await createClient();
  const fn = op === "repay" ? "repay_funding" : "request_funding";
  const { error } = await supabase.rpc(fn, {
    p_startup: startupId,
    p_amount: amount,
  });

  if (error) return { error: error.message };

  refresh(startupId);
  return {
    success:
      op === "repay" ? "Funding repaid to the reserve." : "Funding received.",
  };
}
