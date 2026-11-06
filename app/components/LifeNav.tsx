"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, STARGATE_SECTIONS } from "@/app/life/sections";
import { CRYPTO_LINKS } from "@/app/life/cryptowallstreet/links";

// Top navigation for the Life area. Highlights the active section based on the
// current path. "Life" (the dashboard) is active only on an exact match;
// section links are active when the path is within that section.
export default function LifeNav() {
  const pathname = usePathname();

  // StarGate (overflow feeds) sits right after Travel, before Space.
  const stargate = {
    name: "StarGate",
    href: "/life/stargate",
    exact: false,
    // Highlight StarGate when on any of its feeds too.
    extra: STARGATE_SECTIONS.map((s) => s.href),
  };

  // Primary sections (with StarGate after Travel), then CryptoWallStreet. The
  // profile opens from the photo at the top right of the header. Startups
  // lives on the CryptoWallStreet page instead of the nav.
  const links = [
    { name: "Life", href: "/life", exact: true, extra: [] as string[] },
    ...SECTIONS.filter((s) => s.slug !== "startups").flatMap((s) => [
      { name: s.name, href: s.href, exact: false, extra: [] as string[] },
      ...(s.slug === "travel" ? [stargate] : []),
    ]),
    {
      name: "CryptoWallStreet",
      href: "/life/cryptowallstreet",
      exact: false,
      // Highlight when on Startups or any of its finance pages (excluding
      // /life/profile/*).
      extra: ["/life/startups", ...CRYPTO_LINKS.map((l) => l.href)].filter(
        (h) => !h.startsWith("/life/profile"),
      ),
    },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href) ||
            link.extra.some((p) => pathname.startsWith(p));
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
