import Feed from "../Feed";

export default function MoviesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Movies
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Now showing
      </h1>
      <p className="mt-2 text-white/60">
        Share films and shows, reviews, and what to watch next.
      </p>

      <Feed
        feed="movies"
        placeholder="What are you watching?"
        emptyText="No movies shared yet. Recommend something to watch."
      />
    </div>
  );
}
