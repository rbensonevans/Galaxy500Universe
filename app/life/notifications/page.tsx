import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { FollowButton, RespondButtons } from "../people/ConnectButtons";
import {
  loadRelationships,
  NO_RELATIONSHIP,
  personName,
  profileHref,
  type Person,
} from "../people/relations";

type Notification = {
  id: string;
  actor_id: string;
  kind: string;
  connection_id: string | null;
  read_at: string | null;
  created_at: string;
};

const MESSAGES: Record<string, string> = {
  follow: "followed you",
  friend_request: "sent you a friend request",
  family_request: "wants to connect as family",
  friend_accept: "accepted your friend request",
  family_accept: "accepted your family request",
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, actor_id, kind, connection_id, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const tableMissing = isMissingTableError(error);
  const notes = (rows ?? []) as Notification[];

  const actorIds = Array.from(new Set(notes.map((n) => n.actor_id)));
  const [{ data: actorRows }, rels] = await Promise.all([
    actorIds.length
      ? supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", actorIds)
      : Promise.resolve({ data: [] as Person[] }),
    loadRelationships(supabase, me, actorIds),
  ]);
  const actorById = new Map<string, Person>(
    ((actorRows ?? []) as Person[]).map((p) => [p.id, p]),
  );

  // Viewing the list marks everything read (the unread styling below still
  // reflects the state before this visit).
  if (notes.some((n) => !n.read_at)) {
    await supabase.rpc("mark_notifications_read");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Notifications
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Signals from the universe
      </h1>

      {tableMissing && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0020_people.sql
            </code>{" "}
            in your Supabase SQL Editor to enable notifications.
          </p>
        </div>
      )}

      {!tableMissing && notes.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
          Nothing yet. When someone follows you or sends a friend or family
          request, it shows up here.{" "}
          <Link href="/life/people" className="text-violet-300 hover:text-violet-200">
            Find people
          </Link>
          .
        </div>
      )}

      {notes.length > 0 && (
        <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          {notes.map((n) => {
            const actor = actorById.get(n.actor_id);
            const rel = rels.get(n.actor_id) ?? NO_RELATIONSHIP;
            const isRequest = n.kind === "friend_request" || n.kind === "family_request";
            const conn = n.kind === "friend_request" ? rel.friend : rel.family;
            const pendingForMe =
              isRequest &&
              conn?.status === "pending" &&
              !conn.sentByMe &&
              conn.id === n.connection_id;

            return (
              <li
                key={n.id}
                className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  n.read_at ? "" : "bg-violet-500/10"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-white/80">
                    <Link
                      href={profileHref(n.actor_id, me)}
                      className="font-semibold text-white hover:text-violet-200"
                    >
                      {personName(actor)}
                    </Link>{" "}
                    {MESSAGES[n.kind] ?? n.kind}
                  </p>
                  <p className="text-xs text-white/40">{fmtWhen(n.created_at)}</p>
                </div>

                {n.kind === "follow" && !rel.following && (
                  <FollowButton personId={n.actor_id} rel={rel} />
                )}
                {pendingForMe && conn && (
                  <RespondButtons connectionId={conn.id} label="Accept" />
                )}
                {isRequest && !pendingForMe && (
                  <span className="text-xs text-white/40">
                    {conn?.status === "accepted"
                      ? n.kind === "friend_request"
                        ? "You're friends"
                        : "You're family"
                      : "No longer pending"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
