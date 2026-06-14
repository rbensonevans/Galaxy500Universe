import Feed from "../Feed";

export default function FriendsFamilyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Friends &amp; Family
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Your closest orbits
      </h1>
      <p className="mt-2 text-white/60">
        Share moments with the people who matter most.
      </p>

      <Feed
        feed="family"
        placeholder="Share something with friends & family…"
        emptyText="No posts here yet. Share a moment with your friends and family."
      />
    </div>
  );
}
