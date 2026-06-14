import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";

// Quick links surfaced on the profile. The destination pages are placeholders
// for now and will be built out later.
const PROFILE_LINKS = [
  { name: "Startups", href: "/life/startups" },
  { name: "CryptoWallStreet", href: "/life/cryptowallstreet" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, location, website")
    .eq("id", user!.id)
    .maybeSingle();

  const tableMissing = isMissingTableError(error);

  const initial = (profile?.display_name || email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
          Profile
        </p>
        <Link
          href="/life/profile/settings"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
          Settings
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-fuchsia-500/20">
          {initial}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {profile?.display_name || "Your profile"}
          </h1>
          {profile?.username ? (
            <p className="font-mono text-sm text-violet-200/80">
              @{profile.username}
            </p>
          ) : (
            <p className="text-sm text-white/40">
              <Link
                href="/life/profile/settings"
                className="text-violet-300 hover:text-violet-200"
              >
                Set a @handle
              </Link>{" "}
              to receive transfers
            </p>
          )}
          <p className="text-white/50">{email}</p>
        </div>
      </div>

      {tableMissing && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            The <code className="rounded bg-black/30 px-1">profiles</code> table
            doesn&apos;t exist yet. In your Supabase dashboard, open the SQL
            Editor and run the migration at{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0002_profiles.sql
            </code>
            .
          </p>
        </div>
      )}

      {error && !tableMissing && (
        <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          Couldn&apos;t load your profile: {error.message}
        </div>
      )}

      {!tableMissing && (
        <div className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          {profile?.bio ? (
            <p className="whitespace-pre-wrap text-white/80">{profile.bio}</p>
          ) : (
            <p className="text-white/40">
              No bio yet.{" "}
              <Link
                href="/life/profile/settings"
                className="text-violet-300 hover:text-violet-200"
              >
                Add one in Settings
              </Link>
              .
            </p>
          )}

          {(profile?.location || profile?.website) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/50">
              {profile?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-300/80 hover:text-cyan-200"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
                  </svg>
                  {profile.website}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-10 max-w-2xl">
        <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-white/50">
          Links
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROFILE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/80 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              <span className="font-medium">{link.name}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
