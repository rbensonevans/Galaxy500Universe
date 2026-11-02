"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import "./globals.css";

// Last-resort error page (replaces the root layout when it crashes); reports
// the error to Sentry.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#07061a] px-6 text-center text-white">
        <title>Something went wrong · Galaxy500Universe</title>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-white/60">The error was reported. Please try again.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold transition hover:brightness-110"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </body>
    </html>
  );
}
