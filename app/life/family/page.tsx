import Link from "next/link";
import Feed from "../Feed";

export default function FamilyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Family
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Your home constellation
      </h1>
      <p className="mt-2 text-white/60">
        Share moments with the people you call family. Posts here are seen by
        you and the members you&apos;ve connected with as family in{" "}
        <Link href="/life/people" className="text-violet-300 hover:text-violet-200">
          People
        </Link>
        .
      </p>

      <Feed
        feed="family"
        placeholder="Share something with your family…"
        emptyText="No posts here yet. Share a moment with your family."
      />
    </div>
  );
}
