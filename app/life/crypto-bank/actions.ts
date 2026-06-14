"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BankState = {
  error?: string;
  success?: boolean;
};

const ACCOUNT_KINDS = ["checking", "savings", "money_market"];

function refresh() {
  revalidatePath("/life/crypto-bank");
  revalidatePath("/life/wallet");
}

// Deposit into / withdraw from an account, dispatched by hidden `account`/`op`.
export async function transact(
  _prevState: BankState,
  formData: FormData,
): Promise<BankState> {
  const account = String(formData.get("account") ?? "");
  const op = String(formData.get("op") ?? "deposit");
  const amount = Number(formData.get("amount"));

  if (!ACCOUNT_KINDS.includes(account)) return { error: "Choose an account." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than 0." };
  }

  const supabase = await createClient();
  const fn = op === "withdraw" ? "bank_account_withdraw" : "bank_account_deposit";
  const { error } = await supabase.rpc(fn, { account, amount });

  if (error) return { error: error.message };

  refresh();
  return { success: true };
}

export async function collectInterest(formData: FormData) {
  const account = String(formData.get("account") ?? "");
  if (!ACCOUNT_KINDS.includes(account)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("bank_account_accrue", { account });
  if (!error) refresh();
}
