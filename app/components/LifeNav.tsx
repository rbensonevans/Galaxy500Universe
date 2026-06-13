"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/app/life/sections";

// Top navigation for the Life area. Highlights the active section based on the
// current path. "Life" (the dashboard) is active only on an exact match;
// section links are active when the path is within that section.
export default function LifeNav() {
  const pathname = usePathname();

  const links = [
    { name: "Life", href: "/life", exact: true },
    ...SECTIONS.map((s) => ({ name: s.name, href: s.href, exact: false })),
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-white/15 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
