import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SECTIONS } from "@/app/life/sections";

export default async function LifePage() {
  // The layout already guarantees an authenticated user; fetch again only to
  // personalize the greeting.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = user?.email?.split("@")[0] ?? "traveler";

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Life
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Welcome back, <span className="capitalize">{name}</span>
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Your home in the universe. Choose a constellation to explore.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SECTIONS.map(({ slug, name, href, blurb, icon: Icon, accent }) => (
          <Link
            key={slug}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10"
          >
            <div
              className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${accent} blur-2xl transition group-hover:scale-125`}
              aria-hidden="true"
            />
            <div className="relative flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">{name}</h2>
                <p className="mt-1 text-sm text-white/60">{blurb}</p>
              </div>
            </div>
            <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-200/80 transition group-hover:gap-2">
              Enter
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
