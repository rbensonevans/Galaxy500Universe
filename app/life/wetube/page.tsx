import Feed from "../Feed";

export default function WeTubePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        WeTube
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Watch together
      </h1>
      <p className="mt-2 text-white/60">
        Paste a YouTube link to share a video with fellow citizens.
      </p>

      <Feed
        feed="wetube"
        placeholder="Paste a YouTube link and say something about it…"
        emptyText="No videos yet. Paste a YouTube link to share the first one."
      />
    </div>
  );
}
