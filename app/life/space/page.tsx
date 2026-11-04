import Feed from "../Feed";

export default function SpacePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Space
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        The final frontier
      </h1>
      <p className="mt-2 text-white/60">
        The source of humanity&apos;s endless wealth.
      </p>

      <Feed
        feed="space"
        placeholder="Share something from the final frontier…"
        emptyText="No space posts yet. Share a launch, a discovery, or a view of the stars."
      />
    </div>
  );
}
