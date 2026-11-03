"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/app/components/Avatar";

// The header's profile photo: opens the profile (Settings and Sign out live
// there) and is ringed in violet while you're on any profile page, the way the
// nav highlights the active section.
export default function ProfileLink({
  path,
  name,
}: {
  path?: string | null;
  name: string;
}) {
  const active = usePathname().startsWith("/life/profile");
  return (
    <Link
      href="/life/profile"
      title="Your profile"
      aria-label="Your profile"
      aria-current={active ? "page" : undefined}
      className={`rounded-full ring-2 ring-offset-2 ring-offset-transparent transition ${
        active ? "ring-violet-400" : "ring-white/15 hover:ring-white/40"
      }`}
    >
      <Avatar path={path} name={name} className="h-9 w-9 text-sm" />
    </Link>
  );
}
