"use client";

// Made during the XRP LEDGER HACKATHON
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Header bell with the unread-notification count. The layout (which supplies
// `unread`) persists across client navigation, so the badge is cleared locally
// once the member opens Notifications; a new count from the server shows again.
export default function NotificationBell({ unread }: { unread: number }) {
  const pathname = usePathname();
  const onPage = pathname.startsWith("/life/notifications");
  const [clearedFor, setClearedFor] = useState<number | null>(null);
  if (onPage && clearedFor !== unread) setClearedFor(unread);
  const show = unread > 0 && clearedFor !== unread;

  return (
    <Link
      href="/life/notifications"
      aria-label={show ? `Notifications (${unread} unread)` : "Notifications"}
      className={`relative rounded-full p-2 transition ${
        onPage ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {show && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
