"use client";

import { useActionState } from "react";
import { changePassword, type AuthState } from "@/app/auth/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

const initialState: AuthState = {};

const INPUT =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Current password</span>
        <input type="password" name="current" required autoComplete="current-password" className={INPUT} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">New password</span>
        <input
          type="password"
          name="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={INPUT}
        />
        <span className="text-xs text-white/40">At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Confirm new password</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={INPUT}
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Change password"}
      </button>
      <p className="text-xs text-white/40">
        You&apos;ll stay signed in here; other browsers and devices will be signed out.
      </p>
    </form>
  );
}
