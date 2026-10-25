"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CHAT_PATH = /^\/life\/messages\/([0-9a-f-]{36})/i;

// Header link to Messages with a live unread badge. Subscribes to
// conversation changes over Supabase Realtime (RLS limits events to the
// member's own conversations): each new message bumps the conversation, so the
// badge refetches, and when Messages is open the page refreshes to show it.
export default function MessagesLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const onMessages = pathname.startsWith("/life/messages");
  // The open chat counts as read, so leave it out of the badge.
  const openChat = pathname.match(CHAT_PATH)?.[1] ?? null;

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const refreshCount = async () => {
      const { data } = await supabase.rpc("unread_message_count", {
        p_exclude: openChat,
      });
      if (!cancelled && typeof data === "number") setUnread(data);
    };
    refreshCount();

    const onChange = () => {
      refreshCount();
      if (onMessages) router.refresh();
    };
    const channel = supabase
      .channel("messages-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, onChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, onChange)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [openChat, onMessages, router]);

  return (
    <Link
      href="/life/messages"
      aria-label={unread ? `Messages (${unread} unread)` : "Messages"}
      className={`relative rounded-full p-2 transition ${
        onMessages ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
