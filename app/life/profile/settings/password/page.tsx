import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./ChangePasswordForm";

// Settings → Change password (current password required). Google/LinkedIn-
// only accounts have no password here, so they go back to Settings, where
// Linked accounts points them to their provider's security page.
export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUserIdentities();
  const hasPassword = (data?.identities ?? []).some((i) => i.provider === "email");
  if (!hasPassword) redirect("/life/profile/settings");

  return (
    <div className="max-w-md">
      <Link
        href="/life/profile/settings"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to settings
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Settings
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Change password
      </h1>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
