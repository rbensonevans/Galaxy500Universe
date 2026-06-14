import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Feed from "../../Feed";
import { tickerFor } from "../../stockexchange/market";

export default async function StartupFeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, tagline, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!startup) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/life/startups" className="text-sm text-white/50 hover:text-white">
          ← Startups
        </Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
          This startup couldn&apos;t be found.
        </div>
      </div>
    );
  }

  const isAdmin = startup.user_id === me;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/life/startups"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Startups
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Startup Feed
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-violet-500/20 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-violet-200">
          ${tickerFor(startup.name)}
        </span>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {startup.name}
        </h1>
      </div>
      {startup.tagline && (
        <p className="mt-1 text-violet-200/80">{startup.tagline}</p>
      )}
      <p className="mt-2 text-sm text-white/50">
        {isAdmin
          ? "You're the admin — post updates below. Anyone can comment."
          : "Official updates from this company. You can join the conversation in the comments."}
      </p>

      <Feed
        feed="startup"
        startupId={startup.id}
        canPost={isAdmin}
        postAuthorName={startup.name}
        placeholder={`Post an update from ${startup.name}…`}
        emptyText={
          isAdmin
            ? "No posts yet. Share your first company update."
            : "No posts from this company yet."
        }
      />
    </div>
  );
}
