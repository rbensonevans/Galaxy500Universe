"use client";

import { useActionState, useEffect, useRef } from "react";
import { transferCredits, type TransferState } from "./actions";

const initialState: TransferState = {};

const inputClass =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export default function TransferCard({ balance }: { balance: number | null }) {
  const [state, formAction, isPending] = useActionState(
    transferCredits,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      {balance != null && (
        <p className="text-sm text-white/50">
          Available:{" "}
          {balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          GLXY
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Recipient handle</span>
          <div className="flex items-center gap-2">
            <span className="text-white/40">@</span>
            <input
              name="handle"
              placeholder="theirhandle"
              className={`${inputClass} flex-1`}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/70">Amount (GLXY)</span>
          <input
            name="amount"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            className={inputClass}
          />
        </label>
      </div>

      {state.error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send GLXY"}
      </button>
    </form>
  );
}
