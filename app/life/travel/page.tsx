import Feed from "../Feed";

export default function TravelPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Travel
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Journeys across the universe
      </h1>
      <p className="mt-2 text-white/60">
        Share the places you&apos;ve been and the worlds you dream of exploring.
      </p>

      <Feed
        feed="travel"
        placeholder="Where are you off to?"
        emptyText="No journeys shared yet. Post a place you've been or want to go."
      />
    </div>
  );
}
