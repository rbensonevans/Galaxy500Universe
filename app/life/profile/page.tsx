import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

// Quick links surfaced on the profile. The destination pages are placeholders
// for now and will be built out later.
const PROFILE_LINKS = [
  { name: "Marketplace", href: "/life/marketplace" },
  { name: "Blockchain", href: "/life/blockchain" },
  { name: "Safe Wallet", href: "/life/safe-wallet" },
  { name: "Daily Wallet", href: "/life/daily-wallet" },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, bio, location, website")
    .eq("id", user!.id)
    .maybeSingle();

  const tableMissing =
    error?.code === "42P01" ||
    error?.message?.toLowerCase().includes("does not exist");

  const initial = (profile?.display_name || email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Profile
      </p>

      <div className="mt-3 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-fuchsia-500/20">
          {initial}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {profile?.display_name || "Your profile"}
          </h1>
          <p className="text-white/50">{email}</p>
        </div>
      </div>

      <p className="mt-4 max-w-xl text-white/60">
        This is how you appear across Galaxy500Universe. Update your details
        below.
      </p>

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

      <div className="mt-8 max-w-2xl">
        <ProfileForm profile={profile ?? null} email={email} />
      </div>

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
