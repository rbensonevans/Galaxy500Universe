import Link from "next/link";
import StartupForm from "../StartupForm";

export default function RegisterStartupPage() {
  return (
    <div>
      <Link
        href="/life/startups"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to startups
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Startups
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Register a startup
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Add a company you&apos;re building to your universe.
      </p>

      <div className="mt-8 max-w-2xl">
        <StartupForm />
      </div>
    </div>
  );
}
