"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {};

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, formAction, isPending] = useActionState(
    authenticate,
    initialState,
  );

  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      {/* Mode toggle */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full py-2 font-medium transition ${
            !isSignup
              ? "bg-white text-black"
              : "text-white/70 hover:text-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full py-2 font-medium transition ${
            isSignup ? "bg-white text-black" : "text-white/70 hover:text-white"
          }`}
        >
          Create account
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />

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

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="••••••••"
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
          {isPending
            ? "Entering…"
            : isSignup
              ? "Create account"
              : "Enter the Universe"}
        </button>
      </form>
    </div>
  );
}
