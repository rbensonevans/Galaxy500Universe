import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { personName, type Person } from "../people/relations";

type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  status: "active" | "request";
  requested_by: string | null;
  last_message_at: string;
  a_read_at: string | null;
  b_read_at: string | null;
};

type LastMessage = {
  conversation_id: string;
  sender_id: string;
  body: string | null;
  glxy_amount: string | null;
  created_at: string;
};

function fmtWhen(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const [{ data: convRows, error }, { data: blockRows }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, user_a, user_b, status, requested_by, last_message_at, a_read_at, b_read_at")
      .order("last_message_at", { ascending: false })
      .limit(100),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", me),
  ]);
  const tableMissing = isMissingTableError(error);
  const blocked = new Set((blockRows ?? []).map((b) => b.blocked_id));
  const otherOf = (c: Conversation) => (c.user_a === me ? c.user_b : c.user_a);
  const convs = ((convRows ?? []) as Conversation[]).filter(
    (c) => !blocked.has(otherOf(c)),
  );

  const requests = convs.filter((c) => c.status === "request" && c.requested_by !== me);
  const chats = convs.filter((c) => !(c.status === "request" && c.requested_by !== me));
  const showRequests = tab === "requests";
  const shown = showRequests ? requests : chats;

  const ids = shown.map((c) => c.id);
  const others = shown.map(otherOf);
  const [{ data: msgRows }, { data: profileRows }] = await Promise.all([
    ids.length
      ? supabase
          .from("messages")
          .select("conversation_id, sender_id, body, glxy_amount, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as LastMessage[] }),
    others.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", others)
      : Promise.resolve({ data: [] as Person[] }),
  ]);
  const lastByConv = new Map<string, LastMessage>();
  for (const m of (msgRows ?? []) as LastMessage[]) {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
  }
  const personById = new Map<string, Person>(
    ((profileRows ?? []) as Person[]).map((p) => [p.id, p]),
  );

  const tabClass = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
            Messages
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Direct messages
          </h1>
        </div>
        <Link
          href="/life/people"
          className="mt-1 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          New message
        </Link>
      </div>
      <p className="mt-2 text-white/60">
        Chat one-on-one and send Galaxy Credits. Start a conversation from
        anyone&apos;s profile in People.
      </p>

      <nav className="mt-6 flex gap-1.5">
        <Link href="/life/messages" className={tabClass(!showRequests)}>
          Chats
        </Link>
        <Link href="/life/messages?tab=requests" className={tabClass(showRequests)}>
          Requests{requests.length > 0 ? ` · ${requests.length}` : ""}
        </Link>
      </nav>

      {tableMissing && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0021_messages.sql
            </code>{" "}
            in your Supabase SQL Editor to enable Messages.
          </p>
        </div>
      )}

      {!tableMissing && shown.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
          {showRequests
            ? "No message requests. Messages from members you aren't connected with land here."
            : "No conversations yet. Find someone in People and say hello."}
        </div>
      )}

      {shown.length > 0 && (
        <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          {shown.map((c) => {
            const other = otherOf(c);
            const name = personName(personById.get(other));
            const last = lastByConv.get(c.id);
            const readAt = c.user_a === me ? c.a_read_at : c.b_read_at;
            const unread =
              last != null &&
              last.sender_id !== me &&
              (!readAt || new Date(last.created_at) > new Date(readAt));
            const preview = !last
              ? ""
              : last.glxy_amount != null
                ? `${last.sender_id === me ? "You sent" : "Sent you"} ${Number(last.glxy_amount).toLocaleString()} GLXY`
                : `${last.sender_id === me ? "You: " : ""}${last.body ?? ""}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/life/messages/${other}`}
                  className={`flex items-center gap-3 px-5 py-4 transition hover:bg-white/5 ${
                    unread ? "bg-violet-500/10" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-sm font-bold text-white">
                    {name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className={`truncate text-sm ${unread ? "font-bold text-white" : "font-semibold text-white/90"}`}>
                        {name}
                      </span>
                      <span className="shrink-0 text-xs text-white/40">
                        {fmtWhen(c.last_message_at)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${unread ? "text-white/80" : "text-white/50"}`}>
                        {preview}
                      </span>
                      {c.status === "request" && c.requested_by === me && (
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                          Request sent
                        </span>
                      )}
                      {unread && (
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
