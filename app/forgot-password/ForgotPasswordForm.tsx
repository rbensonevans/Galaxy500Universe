"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/70">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@galaxy.space"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
