import { createClient } from "@/lib/supabase/server";
import { deleteStartup } from "./actions";
import StartupForm from "./StartupForm";

type Startup = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  created_at: string;
};

export default async function StartupsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("startups")
    .select("id, name, tagline, description, website, industry, created_at")
    .order("created_at", { ascending: false });

  // The startups table hasn't been created yet — guide the user to set it up.
  const tableMissing =
    error?.code === "42P01" ||
    error?.message?.toLowerCase().includes("does not exist");

  const startups = (data ?? []) as Startup[];

  return (
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

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <StartupForm />

        <div className="flex flex-col gap-4">
          {startups.length === 0 && !tableMissing ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-white/50">
              No startups yet. Register your first one to launch it into your
              universe.
            </div>
          ) : (
            startups.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {s.name}
                    </h3>
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
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
