"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStartup, type StartupState } from "./actions";

const initialState: StartupState = {};

const inputClass =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export default function StartupForm() {
  const [state, formAction, isPending] = useActionState(
    createStartup,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful registration.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-white/70">Name *</span>
          <input name="name" required placeholder="Nebula Labs" className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-white/70">Tagline</span>
          <input
            name="tagline"
            placeholder="Software for the next frontier"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Industry</span>
          <input name="industry" placeholder="SaaS, Space, AI…" className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Website</span>
          <input
            name="website"
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-white/70">Description</span>
          <textarea
            name="description"
            rows={3}
            placeholder="What are you building, and for whom?"
            className={`${inputClass} resize-y`}
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/40 accent-violet-500"
        />
        <span>
          <span className="text-white/80">List on the Stock Exchange</span>
          <span className="mt-0.5 block text-xs text-white/40">
            Public startups can be funded and traded by members. Uncheck to keep
            it private — hidden from the exchange and not tradable.
          </span>
        </span>
      </label>

      {state.error && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Registering…" : "Register startup"}
      </button>
    </form>
  );
}
