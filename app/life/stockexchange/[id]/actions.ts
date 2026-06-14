"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TradeState = {
  error?: string;
  success?: string;
};

// Buy or sell startup shares at the current engagement-driven price, dispatched
// by the hidden `op` field. The GLXY/share moves happen in SECURITY DEFINER
// functions (universe is the market maker).
export async function trade(
  _prevState: TradeState,
  formData: FormData,
): Promise<TradeState> {
  const startupId = String(formData.get("startup_id") ?? "");
  const op = String(formData.get("op") ?? "buy");
  const qty = Number(formData.get("qty"));

  if (!startupId) return { error: "Missing startup." };
  if (!Number.isFinite(qty) || qty <= 0) {
    return { error: "Enter a quantity greater than 0." };
  }

  const supabase = await createClient();
  const fn = op === "sell" ? "sell_shares" : "buy_shares";
  const { data, error } = await supabase.rpc(fn, {
    p_startup: startupId,
    p_qty: qty,
  });

  if (error) return { error: error.message };

  revalidatePath(`/life/stockexchange/${startupId}`);
  revalidatePath("/life/stockexchange");
  revalidatePath("/life/wallet");

  const amount = Number(data ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return {
    success:
      op === "sell"
        ? `Sold — received ${amount} GLXY.`
        : `Bought — paid ${amount} GLXY.`,
  };
}
