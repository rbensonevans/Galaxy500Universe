// Made during the XRP LEDGER HACKATHON

import Feed from "../Feed";

export default function UniversalFeedPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Universal Feed
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Across the universe
      </h1>
      <p className="mt-2 text-white/60">
        Public posts and Startup Feed updates from every corner of
        Galaxy500Universe.
      </p>

      <Feed
        feed="universal"
        universal
        emptyText="Nothing in the universe yet. Share a post to the Universal Feed to start the conversation."
      />
    </div>
  );
}
