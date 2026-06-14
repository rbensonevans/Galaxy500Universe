"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { transact, type BankState } from "./actions";

const initialState: BankState = {};

export default function BankPanel({
  spendable,
  savings,
}: {
  spendable: number;
  savings: number;
}) {
  const [op, setOp] = useState<"deposit" | "withdraw">("deposit");
  const [state, formAction, isPending] = useActionState(transact, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the amount after a successful transaction (DOM reset, no setState).
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const depositing = op === "deposit";
  const max = depositing ? spendable : savings;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
        <button
          type="button"
          onClick={() => setOp("deposit")}
          className={`rounded-full py-2 text-center font-medium transition ${
            depositing ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setOp("withdraw")}
          className={`rounded-full py-2 text-center font-medium transition ${
            !depositing ? "bg-violet-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Withdraw
        </button>
      </div>

      <input type="hidden" name="op" value={op} />

      <label className="mt-5 flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-white/70">
          <span>Amount (GLXY)</span>
          <span className="text-xs text-white/40">
            Available:{" "}
            {max.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </span>
        <input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
      </label>

      {state.error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
          depositing ? "bg-emerald-500" : "bg-violet-500"
        }`}
      >
        {isPending
          ? "Working…"
          : depositing
            ? "Deposit to savings"
            : "Withdraw to wallet"}
      </button>
    </form>
  );
}
