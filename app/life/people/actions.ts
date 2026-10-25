"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Follow / friend / family actions. The writes (and the notifications they
// send) happen in SECURITY DEFINER SQL functions; see 0020_people.sql.

const KINDS = ["friend", "family"];

async function call(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.rpc(fn, args);
  // Relationship state shows on profiles, People, notifications, the header
  // badge, and Friends / Family feed visibility, so refresh the whole area.
  revalidatePath("/life", "layout");
}

function target(formData: FormData) {
  return String(formData.get("target") ?? "");
}

function kind(formData: FormData) {
  const k = String(formData.get("kind") ?? "");
  return KINDS.includes(k) ? k : null;
}

export async function followUser(formData: FormData) {
  const id = target(formData);
  if (id) await call("follow_user", { p_target: id });
}

export async function unfollowUser(formData: FormData) {
  const id = target(formData);
  if (id) await call("unfollow_user", { p_target: id });
}

export async function requestConnection(formData: FormData) {
  const id = target(formData);
  const k = kind(formData);
  if (id && k) await call("request_connection", { p_target: id, p_kind: k });
}

export async function removeConnection(formData: FormData) {
  const id = target(formData);
  const k = kind(formData);
  if (id && k) await call("remove_connection", { p_target: id, p_kind: k });
}

export async function respondConnection(formData: FormData) {
  const id = String(formData.get("connection_id") ?? "");
  const accept = formData.get("accept") === "1";
  if (id) await call("respond_connection", { p_id: id, p_accept: accept });
}
