import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import ProfileForm from "../ProfileForm";
import LinkedAccounts from "./LinkedAccounts";
import { PROVIDER_LABELS } from "@/lib/verification";

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string; unlinked?: string; link_error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, location, website, discoverable") // Made during the XRP LEDGER HACKATHON
    .eq("id", user!.id)
    .maybeSingle();

  const tableMissing = isMissingTableError(error);

  const { data: idData } = await supabase.auth.getUserIdentities();
  const identities = idData?.identities ?? [];
  const providers = identities.map((i) => i.provider).filter((p) => p !== "email");
  const notice = params.linked
    ? "Account linked."
    : params.unlinked
      ? `${PROVIDER_LABELS[params.unlinked] ?? "Account"} unlinked.`
      : undefined;

  return (
    <div>
      <Link
        href="/life/profile"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to profile
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Settings
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Edit profile
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Update how you appear across Galaxy500Universe.
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

      <div className="mt-8 max-w-2xl">
        <LinkedAccounts
          providers={providers}
          hasEmail={identities.some((i) => i.provider === "email")}
          notice={notice}
          error={params.link_error}
        />
      </div>
    </div>
  );
}
