import Feed from "../Feed";

export default function SportsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Sports
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Game on
      </h1>
      <p className="mt-2 text-white/60">
        Teams, scores, highlights, and everything in play.
      </p>

      <Feed
        feed="sports"
        placeholder="What's the play?"
        emptyText="No sports posts yet. Share a score, a highlight, or your team."
      />
    </div>
  );
}
