"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Direct-message actions. Permissions (message requests, blocks, the GLXY
// balance move) are enforced in SECURITY DEFINER SQL; see 0021_messages.sql.

export type ChatState = {
  error?: string;
  success?: boolean;
};

function refresh() {
  revalidatePath("/life/messages", "layout");
}

export async function sendMessage(
  _prevState: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const to = String(formData.get("to") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_message", {
    p_to: to,
    p_body: body,
  });
  if (error) return { error: error.message };

  refresh();
  return { success: true };
}

export async function sendGlxy(
  _prevState: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const to = String(formData.get("to") ?? "");
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "");
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_glxy_message", {
    p_to: to,
    p_amount: amount,
    p_note: note,
  });
  if (error) return { error: error.message };

  refresh();
  revalidatePath("/life/wallet");
  return { success: true };
}

export async function respondMessageRequest(formData: FormData) {
  const id = String(formData.get("conversation_id") ?? "");
  const accept = formData.get("accept") === "1";
  if (!id) return;
  const supabase = await createClient();
  await supabase.rpc("respond_message_request", {
    p_conversation: id,
    p_accept: accept,
  });
  refresh();
  if (!accept) redirect("/life/messages?tab=requests");
}

export async function deleteMessage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.rpc("delete_message", { p_id: id });
  refresh();
}

export async function blockUser(formData: FormData) {
  const id = String(formData.get("target") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.rpc("block_user", { p_target: id });
  // Blocking also removes follows and connections, so refresh everything.
  revalidatePath("/life", "layout");
}

export async function unblockUser(formData: FormData) {
  const id = String(formData.get("target") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.rpc("unblock_user", { p_target: id });
  revalidatePath("/life", "layout");
}
