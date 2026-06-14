import Feed from "../Feed";

export default function CommunitiesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Communities
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Find your people
      </h1>
      <p className="mt-2 text-white/60">
        Share and discover across the communities you care about.
      </p>

      <Feed
        feed="communities"
        placeholder="Share something with the community…"
        emptyText="No community posts yet. Start the conversation."
      />
    </div>
  );
}
