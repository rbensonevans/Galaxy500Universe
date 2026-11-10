import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import ProfileForm from "../ProfileForm";
import LinkedAccounts from "./LinkedAccounts";
import { PROVIDER_LABELS } from "@/lib/verification";

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    linked?: string;
    unlinked?: string;
    link_error?: string;
    password_changed?: string;
  }>;
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
  // Google/LinkedIn-only accounts have no password here; theirs is managed by
  // the provider, so there's nothing to change.
  const hasPassword = identities.some((i) => i.provider === "email");
  const notice = params.linked
    ? "Account linked."
    : params.unlinked
      ? `${PROVIDER_LABELS[params.unlinked] ?? "Account"} unlinked.`
      : undefined;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/life/profile"
          className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back to profile
        </Link>
        {hasPassword && (
          <Link
            href="/life/profile/settings/password"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Change password
          </Link>
        )}
      </div>

      {params.password_changed && (
        <p className="mt-4 max-w-2xl rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          Password changed. Other browsers and devices have been signed out.
        </p>
      )}

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
          hasEmail={hasPassword}
          notice={notice}
          error={params.link_error}
        />
      </div>
    </div>
  );
}
