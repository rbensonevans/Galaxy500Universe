import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { personName, UUID_RE } from "../../people/relations";
import { deleteMessage, respondMessageRequest } from "../actions";
import BlockButton from "../BlockButton";
import ChatComposer from "../ChatComposer";
import ScrollToEnd from "../ScrollToEnd";

type Message = {
  id: string;
  sender_id: string;
  body: string | null;
  glxy_amount: string | null;
  image_path: string | null;
  created_at: string;
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtGlxy(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// A one-to-one chat with another member, addressed by their user id. The
// conversation is created by the first message sent.
export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: other } = await params;
  if (!UUID_RE.test(other)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;
  if (other === me) redirect("/life/messages");

  const [
    { data: profile },
    { data: conv },
    { data: block },
    { data: canDirect },
    { data: wallet },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", other)
      .maybeSingle(),
    supabase
      .from("conversations")
      .select("id, user_a, a_read_at, b_read_at, status, requested_by")
      .or(
        `and(user_a.eq.${me},user_b.eq.${other}),and(user_a.eq.${other},user_b.eq.${me})`,
      )
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", me)
      .eq("blocked_id", other)
      .maybeSingle(),
    supabase.rpc("can_message_directly", { a: me, b: other }),
    supabase.from("wallets").select("balance").eq("user_id", me).maybeSingle(),
  ]);
  const name = personName(profile);
  const blockedByMe = Boolean(block);

  // Newest 200 messages, shown oldest-first.
  const { data: rows } = conv
    ? await supabase
        .from("messages")
        .select("id, sender_id, body, glxy_amount, image_path, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };
  const messages = ((rows ?? []) as Message[]).reverse();

  // Images live in a private bucket; the storage read policy lets only the
  // two members create these short-lived links.
  const imagePaths = messages.flatMap((m) => (m.image_path ? [m.image_path] : []));
  const { data: signed } = imagePaths.length
    ? await supabase.storage.from("message-images").createSignedUrls(imagePaths, 60 * 60)
    : { data: [] };
  const imageUrl = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) imageUrl.set(s.path, s.signedUrl);
  }

  // Opening the chat reads it.
  if (conv) {
    const readAt = conv.user_a === me ? conv.a_read_at : conv.b_read_at;
    const last = messages.at(-1);
    if (
      last &&
      last.sender_id !== me &&
      (!readAt || new Date(last.created_at) >= new Date(readAt))
    ) {
      await supabase.rpc("mark_conversation_read", { p_conversation: conv.id });
    }
  }

  const incomingRequest = conv?.status === "request" && conv.requested_by !== me;
  const outgoingRequest = conv?.status === "request" && conv.requested_by === me;
  const glxyEnabled = conv ? conv.status === "active" : Boolean(canDirect);

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <Link
        href="/life/messages"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Messages
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <Link href={`/life/people/${other}`} className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-lg font-bold text-white">
            {name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-bold text-white hover:text-violet-200">
              {name}
            </span>
            {profile?.username && profile.display_name && (
              <span className="block font-mono text-xs text-violet-200/70">
                @{profile.username}
              </span>
            )}
          </span>
        </Link>
        <BlockButton personId={other} blocked={blockedByMe} />
      </div>

      {incomingRequest && conv && (
        <div className="mt-5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
          <p className="text-sm text-white/80">
            <span className="font-semibold text-white">{name}</span> wants to
            message you. You aren&apos;t connected yet — accept to keep
            chatting (replying also accepts), or decline to remove the request.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <form action={respondMessageRequest}>
              <input type="hidden" name="conversation_id" value={conv.id} />
              <input type="hidden" name="accept" value="1" />
              <button
                type="submit"
                className="rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-medium text-white transition hover:bg-violet-500/30"
              >
                Accept
              </button>
            </form>
            <form action={respondMessageRequest}>
              <input type="hidden" name="conversation_id" value={conv.id} />
              <input type="hidden" name="accept" value="0" />
              <button
                type="submit"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Decline
              </button>
            </form>
          </div>
        </div>
      )}

      {outgoingRequest && (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
          Message request sent. You can send up to 5 messages until {name}{" "}
          accepts; images and Send GLXY unlock once they do.
        </p>
      )}

      {!conv && !canDirect && !blockedByMe && (
        <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
          You and {name} aren&apos;t connected, so your first message arrives
          as a message request. Friends, family, and members who follow each
          other can message directly.
        </p>
      )}

      <div className="mt-5 flex max-h-[60svh] min-h-48 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-white/40">Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === me;
            const amount = m.glxy_amount == null ? null : Number(m.glxy_amount);
            return (
              <div
                key={m.id}
                className={`group flex max-w-[80%] flex-col ${mine ? "items-end self-end" : "items-start self-start"}`}
              >
                {amount != null ? (
                  <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-wider text-cyan-200/80">
                      {mine ? "You sent" : `${name} sent you`}
                    </p>
                    <p className="text-xl font-bold tabular-nums text-white">
                      {fmtGlxy(amount)}{" "}
                      <span className="text-sm font-semibold text-white/60">GLXY</span>
                    </p>
                    {m.body && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                        {m.body}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {m.image_path &&
                      (imageUrl.get(m.image_path) ? (
                        <a
                          href={imageUrl.get(m.image_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-2xl border border-white/10"
                        >
                          {/* Signed URL of arbitrary dimensions — plain img. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl.get(m.image_path)}
                            alt=""
                            className="max-h-80 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <p className="rounded-2xl bg-white/5 px-3.5 py-2 text-xs text-white/40">
                          Image unavailable
                        </p>
                      ))}
                    {m.body && (
                      <p
                        className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                          m.image_path ? "mt-1" : ""
                        } ${
                          mine
                            ? "bg-gradient-to-br from-violet-500/70 to-fuchsia-500/60 text-white"
                            : "bg-white/10 text-white/90"
                        }`}
                      >
                        {m.body}
                      </p>
                    )}
                  </>
                )}
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/30">
                  {fmtWhen(m.created_at)}
                  {mine && amount == null && (
                    <form action={deleteMessage}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="opacity-0 transition hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
        <ScrollToEnd count={messages.length} />
      </div>

      <div className="mt-4">
        {blockedByMe ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            You blocked {name}. Unblock them to send messages.
          </p>
        ) : (
          <ChatComposer
            to={other}
            recipientName={name}
            glxyEnabled={glxyEnabled}
            balance={wallet ? Number(wallet.balance) : null}
          />
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-white/30">
        Messages are private to you and {name}, but they are not end-to-end
        encrypted.
      </p>
    </div>
  );
}
