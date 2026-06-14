import Link from "next/link";
import { MORE_SECTIONS } from "../sections";

export default function MorePage() {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        More
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        More spaces
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Extra feeds and spaces across Galaxy500Universe.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {MORE_SECTIONS.map(({ slug, name, href, blurb, icon: Icon, accent }) => (
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
