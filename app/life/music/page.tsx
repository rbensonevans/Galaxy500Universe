import Feed from "../Feed";

export default function MusicPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Music
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Turn it up
      </h1>
      <p className="mt-2 text-white/60">
        Share tracks, artists, and the sounds moving you right now.
      </p>

      <Feed
        feed="music"
        placeholder="What are you listening to?"
        emptyText="No music shared yet. Drop a track or an artist you love."
      />
    </div>
  );
}
