import Link from "next/link";
import Feed from "../Feed";

const TABS = [
  { key: "wetube", label: "WeTube", href: "/life/wetube" },
  { key: "universal", label: "Universal", href: "/life/wetube?tab=universal" },
];

// WeTube: the WeTube feed (post YouTube links), and the Universal tab: every
// public video from any feed, newest first, with search by title or text.
export default async function WeTubePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab, q } = await searchParams;
  const universal = tab === "universal";
  const search = q?.trim().slice(0, 100) ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        WeTube
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        {universal ? "Watch together" : "My Videos"}
      </h1>
      <p className="mt-2 text-white/60">
        {universal
          ? "Every public video across the galaxy, newest first."
          : "Paste a YouTube link to view later or share a video with fellow citizens."}
      </p>

      <nav className="mt-6 flex gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-sm sm:w-fit">
        {TABS.map((t) => {
          const active = (t.key === "universal") === universal;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 rounded-full px-5 py-1.5 text-center font-medium transition ${
                active ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {universal ? (
        <>
          <form action="/life/wetube" className="mt-6 flex gap-2">
            <input type="hidden" name="tab" value="universal" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search videos by title or description"
              aria-label="Search videos"
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
            />
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Search
            </button>
          </form>
          <Feed
            key={search}
            feed="wetube"
            universal
            videos
            search={search}
            emptyText={
              search
                ? `No videos match "${search}".`
                : "No public videos yet. Videos shared publicly in any feed appear here."
            }
          />
        </>
      ) : (
        <Feed
          feed="wetube"
          placeholder="Paste a YouTube link and say something about it…"
          emptyText="No videos yet. Paste a YouTube link to share the first one."
        />
      )}
    </div>
  );
}
