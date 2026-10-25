// Made during the XRP LEDGER HACKATHON

import Link from "next/link";
import Feed from "../Feed";

export default function FriendsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Friends
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Your closest orbits
      </h1>
      <p className="mt-2 text-white/60">
        Share moments with the friends who light up your universe. Posts here
        are seen by you and your accepted friends — find them in{" "}
        <Link href="/life/people" className="text-violet-300 hover:text-violet-200">
          People
        </Link>
        .
      </p>

      <Feed
        feed="friends"
        placeholder="Share something with your friends…"
        emptyText="No posts here yet. Share a moment with your friends."
      />
    </div>
  );
}
