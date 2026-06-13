import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

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
    </div>
  );
}
