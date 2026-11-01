import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/app/components/AuthCard";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password · Galaxy500Universe" };

// Reached from the Reset password email via /auth/confirm, which has already
// signed the member in. Without a session the link has expired.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthCard
        title="Link expired"
        subtitle="Your password reset link has expired or was already used."
      >
        <Link
          href="/forgot-password"
          className="block rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2.5 text-center font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle={`For ${user.email}`}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
