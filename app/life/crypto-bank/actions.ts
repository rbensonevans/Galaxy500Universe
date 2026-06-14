"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BankState = {
  error?: string;
  success?: boolean;
};

function refresh() {
  revalidatePath("/life/crypto-bank");
  revalidatePath("/life/wallet");
}

// Deposit into / withdraw from savings, dispatched by the hidden `op` field.
export async function transact(
  _prevState: BankState,
  formData: FormData,
): Promise<BankState> {
  const op = String(formData.get("op") ?? "deposit");
  const amount = Number(formData.get("amount"));

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than 0." };
  }

  const supabase = await createClient();
  const fn = op === "withdraw" ? "bank_withdraw" : "bank_deposit";
  const { error } = await supabase.rpc(fn, { amount });

  if (error) return { error: error.message };

  refresh();
  return { success: true };
}

export async function collectInterest() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("bank_accrue_interest");
  if (!error) refresh();
}
