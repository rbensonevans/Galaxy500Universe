// Made during the XRP LEDGER HACKATHON

import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type Person = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export type ConnectionState = {
  id: string;
  status: "pending" | "accepted";
  /** True when the current member sent the request. */
  sentByMe: boolean;
} | null;

export type Relationship = {
  following: boolean;
  followsMe: boolean;
  friend: ConnectionState;
  family: ConnectionState;
};

export const NO_RELATIONSHIP: Relationship = {
  following: false,
  followsMe: false,
  friend: null,
  family: null,
};

export function personName(p: Pick<Person, "username" | "display_name"> | null | undefined) {
  return p?.display_name?.trim() || (p?.username ? `@${p.username}` : "Galaxy member");
}

export function profileHref(id: string, me: string) {
  return id === me ? "/life/profile" : `/life/people/${id}`;
}

// Strict UUID check so ids can be interpolated into PostgREST filters safely.
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Follow and friend/family state between the current member and each of `ids`.
export async function loadRelationships(
  supabase: Supabase,
  me: string,
  ids: string[],
): Promise<Map<string, Relationship>> {
  const others = Array.from(new Set(ids.filter((id) => id !== me && UUID_RE.test(id))));
  const result = new Map<string, Relationship>(
    others.map((id) => [id, { ...NO_RELATIONSHIP }]),
  );
  if (!others.length) return result;

  const list = others.join(",");
  const [{ data: following }, { data: followers }, { data: conns }] =
    await Promise.all([
      supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", me)
        .in("followee_id", others),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("followee_id", me)
        .in("follower_id", others),
      supabase
        .from("connections")
        .select("id, requester_id, addressee_id, kind, status")
        .or(
          `and(requester_id.eq.${me},addressee_id.in.(${list})),and(addressee_id.eq.${me},requester_id.in.(${list}))`,
        ),
    ]);

  for (const f of following ?? []) result.get(f.followee_id)!.following = true;
  for (const f of followers ?? []) result.get(f.follower_id)!.followsMe = true;
  for (const c of conns ?? []) {
    const sentByMe = c.requester_id === me;
    const other = sentByMe ? c.addressee_id : c.requester_id;
    const rel = result.get(other);
    if (!rel || (c.kind !== "friend" && c.kind !== "family")) continue;
    rel[c.kind as "friend" | "family"] = { id: c.id, status: c.status, sentByMe };
  }
  return result;
}
