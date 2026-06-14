import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { deleteStartup, setStartupVisibility } from "./actions";

type Startup = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  is_public: boolean;
  created_at: string;
};

function RegisterButton() {
  return (
    <Link
      href="/life/startups/register"
      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Register a startup
    </Link>
  );
}

export default async function StartupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("startups")
    .select("id, name, tagline, description, website, industry, is_public, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const tableMissing = isMissingTableError(error);
  const startups = (data ?? []) as Startup[];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
            Startups
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Your startups
          </h1>
          <p className="mt-3 max-w-xl text-white/60">
            Register the companies you create and keep them in your orbit.
          </p>
        </div>
        {!tableMissing && <RegisterButton />}
      </div>

      {tableMissing && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            The <code className="rounded bg-black/30 px-1">startups</code> table
            doesn&apos;t exist yet. In your Supabase dashboard, open the SQL
            Editor and run the migration at{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0001_startups.sql
            </code>
            .
          </p>
        </div>
      )}

      {error && !tableMissing && (
        <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          Couldn&apos;t load your startups: {error.message}
        </div>
      )}

      {!tableMissing &&
        (startups.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            {/* On-theme illustration served from /public — plain img keeps it simple. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/happy-team.svg"
              alt="A happy team ready to build"
              className="w-full max-w-sm"
            />
            <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
              Let&apos;s build a startup
            </h2>
            <p className="mt-2 max-w-md text-white/60">
              You haven&apos;t registered any startups yet. Launch your first one
              into your universe.
            </p>
            <div className="mt-6">
              <RegisterButton />
            </div>
          </div>
        ) : (
          <div className="mt-8 flex max-w-2xl flex-col gap-4">
            {startups.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {s.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          s.is_public
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {s.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    {s.tagline && (
                      <p className="mt-0.5 text-sm text-violet-200/80">
                        {s.tagline}
                      </p>
                    )}
                  </div>
                  <form action={deleteStartup}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${s.name}`}
                      className="rounded-md px-2 py-1 text-xs text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </form>
                </div>

                {s.description && (
                  <p className="mt-2 text-sm text-white/60">{s.description}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                  {s.industry && <span>{s.industry}</span>}
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300/80 hover:text-cyan-200"
                    >
                      Visit site →
                    </a>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/life/startups/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Startup Feed
                  </Link>
                  <Link
                    href={`/life/startups/${s.id}/funding`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Funding
                  </Link>
                  <form action={setStartupVisibility}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="is_public"
                      value={(!s.is_public).toString()}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      {s.is_public ? "Make private" : "Make public"}
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ))}
    </div>
  );
}
