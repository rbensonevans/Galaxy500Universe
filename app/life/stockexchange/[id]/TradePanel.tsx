"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { trade, type TradeState } from "./actions";
import { formatUsd } from "../market";

const initialState: TradeState = {};

export default function TradePanel({
  startupId,
  ticker,
  price,
  available,
  holding,
  tradable,
  initialSide,
}: {
  startupId: string;
  ticker: string;
  price: number;
  available: number;
  holding: number;
  tradable: boolean;
  initialSide: "buy" | "sell";
}) {
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [state, formAction, isPending] = useActionState(trade, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const estimateRef = useRef<HTMLSpanElement>(null);

  // Clear the form and estimate after a successful trade. DOM-only (no
  // setState) so it doesn't trigger cascading renders.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (estimateRef.current) estimateRef.current.textContent = formatUsd(0);
    }
  }, [state.success]);

  const buy = side === "buy";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <input type="hidden" name="startup_id" value={startupId} />
      <input type="hidden" name="op" value={side} />

      <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`rounded-full py-2 text-center font-medium transition ${
            buy ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`rounded-full py-2 text-center font-medium transition ${
            !buy ? "bg-rose-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      {!tradable ? (
        <p className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Not tradable yet — this startup hasn&apos;t taken funding, so no equity
          is on the market.
        </p>
      ) : (
        <div className="mt-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center justify-between text-white/70">
              <span>Shares</span>
              <span className="text-xs text-white/40">
                {buy
                  ? `${available.toLocaleString()} available`
                  : `You hold ${holding.toLocaleString()}`}
              </span>
            </span>
            <input
              name="qty"
              type="number"
              min={0}
              step="1"
              placeholder="0"
              onChange={(e) => {
                const n = Math.max(0, Number(e.target.value) || 0);
                if (estimateRef.current) {
                  estimateRef.current.textContent = formatUsd(n * price);
                }
              }}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
            />
          </label>

          <div className="mt-3 flex justify-between text-sm text-white/50">
            <span>Estimated {buy ? "cost" : "proceeds"}</span>
            <span ref={estimateRef} className="tabular-nums text-white/80">
              {formatUsd(0)}
            </span>
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
            className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
              buy ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {isPending ? "Working…" : `${buy ? "Buy" : "Sell"} $${ticker}`}
          </button>
        </div>
      )}
    </form>
  );
}
