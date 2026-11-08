// Made during the XRP LEDGER HACKATHON

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOPIC_SLUG, topicHref } from "@/lib/topics";
import Feed from "../Feed";

const chip =
  "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 backdrop-blur transition hover:border-white/30 hover:bg-white/10 hover:text-white";

// The Universal Feed, with a Topics tab: pick a topic (or a hashtag citizens
// are using) to see just the public posts about it.
export default async function UniversalFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; topic?: string }>;
}) {
  const { tab, topic: topicParam } = await searchParams;
  const topicsTab = tab === "topics";
  const slug = topicParam?.toLowerCase();
  const topicSlug = slug && TOPIC_SLUG.test(slug) ? slug : undefined;

  const supabase = await createClient();
  const [{ data: topics }, { data: trending }] = topicsTab
    ? await Promise.all([
        supabase.from("topics").select("slug, name").order("sort"),
        topicSlug ? Promise.resolve({ data: [] }) : supabase.rpc("trending_hashtags"),
      ])
    : [{ data: [] }, { data: [] }];
  const topicName = topics?.find((t) => t.slug === topicSlug)?.name;
  const tabs = [
    { label: "Universal", href: "/life/universe", active: !topicsTab },
    { label: "Topics", href: "/life/universe?tab=topics", active: topicsTab },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Universal Feed
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        {topicsTab ? "Topics" : "Across the universe"}
      </h1>
      <p className="mt-2 text-white/60">
        {topicsTab
          ? "Zero in on what interests you. Add a #hashtag to a public post to start a topic of your own."
          : "Public posts and Startup Feed updates from every corner of Galaxy500Universe."}
      </p>

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

      {!topicsTab ? (
        <Feed
          feed="universal"
          universal
          emptyText="Nothing in the universe yet. Share a post to the Universal Feed to start the conversation."
        />
      ) : topicSlug ? (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">
              {topicName ?? `#${topicSlug}`}
            </h2>
            <Link href="/life/universe?tab=topics" className="text-sm text-violet-300 hover:text-violet-200">
              All topics
            </Link>
          </div>
          <Feed
            key={topicSlug}
            feed="universal"
            topicSlug={topicSlug}
            emptyText={`No public posts about ${topicName ?? `#${topicSlug}`} yet. Mention it or use #${topicSlug} in a public post.`}
          />
        </>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(topics ?? []).map((t) => (
              <Link key={t.slug} href={topicHref(t.slug)} className={chip}>
                {t.name}
              </Link>
            ))}
          </div>
          {(trending ?? []).length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-medium uppercase tracking-[0.25em] text-white/50">
                Trending hashtags
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(trending as { tag: string; posts: number }[]).map((h) => (
                  <Link key={h.tag} href={topicHref(h.tag)} className={chip}>
                    #{h.tag}
                    <span className="ml-1.5 text-xs text-white/40">{h.posts}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
