"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { fund, type FundingState } from "./actions";

const initialState: FundingState = {};

const inputClass =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export default function FundingPanel({
  startupId,
  outstanding,
}: {
  startupId: string;
  outstanding: number;
}) {
  const [op, setOp] = useState<"request" | "repay">("request");
  const [state, formAction, isPending] = useActionState(fund, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const requesting = op === "request";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
        <button
          type="button"
          onClick={() => setOp("request")}
          className={`rounded-full py-2 text-center font-medium transition ${
            requesting ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Request
        </button>
        <button
          type="button"
          onClick={() => setOp("repay")}
          className={`rounded-full py-2 text-center font-medium transition ${
            !requesting ? "bg-violet-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Repay
        </button>
      </div>

      <input type="hidden" name="startup_id" value={startupId} />
      <input type="hidden" name="op" value={op} />

      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-white/70">
          <span>Amount (GLXY)</span>
          {!requesting && (
            <span className="text-xs text-white/40">
              Outstanding:{" "}
              {outstanding.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </span>
        <input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          className={inputClass}
        />
        {requesting && (
          <span className="text-xs text-white/30">
            Shares are pledged to the universe at the funding price.
          </span>
        )}
      </label>

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
        className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
          requesting ? "bg-emerald-500" : "bg-violet-500"
        }`}
      >
        {isPending
          ? "Working…"
          : requesting
            ? "Request funding"
            : "Repay funding"}
      </button>
    </form>
  );
}
