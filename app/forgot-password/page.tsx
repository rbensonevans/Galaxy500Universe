import type { Metadata } from "next";
import AuthCard from "@/app/components/AuthCard";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password · Galaxy500Universe" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your account's email and we'll send you a link to set a new password."
    >
      {expired && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          That reset link has expired or was already used. Request a new one.
        </p>
      )}
      <ForgotPasswordForm />
      <p className="mt-5 text-xs text-white/40">
        Signed up with Google or LinkedIn? You don&apos;t need a password; use
        that button on the sign-in page.
      </p>
    </AuthCard>
  );
}
