import Feed from "../Feed";

export default function GamingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Gaming
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Press start
      </h1>
      <p className="mt-2 text-white/60">
        Share games, clips, and find your squad.
      </p>

      <Feed
        feed="gaming"
        placeholder="What are you playing?"
        emptyText="No gaming posts yet. Share a game, a clip, or a high score."
      />
    </div>
  );
}
