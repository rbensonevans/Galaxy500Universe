import Link from "next/link";
import Feed from "./Feed";

// A topic page (WeTube, Music, Sports, Travel) with two tabs:
//   * the topic tab: the topic's feed with the post box (posts are private
//     unless the citizen ticks "Share to Universal Feed");
//   * Universal: every public post on the topic from across the galaxy,
//     newest first, with a search bar instead of the post box.
// The tab and search live in the URL (?tab=universal&q=…).
export default async function TopicPage({
  feed,
  name,
  title,
  subtitle,
  universalTitle = title,
  universalSubtitle,
  placeholder,
  emptyText,
  searchPlaceholder,
  videos = false,
  searchParams,
}: {
  feed: string;
  /** Eyebrow and topic-tab label, e.g. "Music". */
  name: string;
  title: string;
  subtitle: string;
  universalTitle?: string;
  universalSubtitle: string;
  placeholder: string;
  emptyText: string;
  searchPlaceholder: string;
  /** Universal shows public videos from any feed (WeTube). */
  videos?: boolean;
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab, q } = await searchParams;
  const universal = tab === "universal";
  const search = q?.trim().slice(0, 100) ?? "";
  const path = `/life/${feed}`;
  const tabs = [
    { label: name, href: path, active: !universal },
    { label: "Universal", href: `${path}?tab=universal`, active: universal },
  ];

  // WeTube's Universal tab is a video grid, so it uses the full page width.
  const wide = universal && videos;

  return (
    <div className={wide ? "w-full" : "mx-auto max-w-2xl"}>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        {name}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        {universal ? universalTitle : title}
      </h1>
      <p className="mt-2 text-white/60">{universal ? universalSubtitle : subtitle}</p>

      <nav className="mt-6 flex gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-sm sm:w-fit">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`flex-1 rounded-full px-5 py-1.5 text-center font-medium transition ${
              t.active ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {universal ? (
        <>
          <form action={path} className="mt-6 flex max-w-2xl gap-2">
            <input type="hidden" name="tab" value="universal" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={searchPlaceholder}
              aria-label="Search"
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
            feed={feed}
            universal
            videos={videos}
            topic={!videos}
            grid={videos}
            search={search}
            emptyText={
              search
                ? `Nothing matches "${search}".`
                : videos
                  ? "No public videos yet. Videos shared publicly in any feed appear here."
                  : `Nothing public yet. ${name} posts shared to the Universal Feed appear here.`
            }
          />
        </>
      ) : (
        <Feed feed={feed} placeholder={placeholder} emptyText={emptyText} />
      )}
    </div>
  );
}
