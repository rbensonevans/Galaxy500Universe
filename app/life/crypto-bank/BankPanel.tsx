"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { transact, type BankState } from "./actions";
import { ACCOUNTS, type AccountKind } from "./accounts";

const initialState: BankState = {};

function fmt(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankPanel({
  spendable,
  balances,
}: {
  spendable: number;
  balances: Record<AccountKind, number>;
}) {
  const [account, setAccount] = useState<AccountKind>("checking");
  const [op, setOp] = useState<"deposit" | "withdraw">("deposit");
  const [state, formAction, isPending] = useActionState(transact, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const depositing = op === "deposit";
  const available = depositing ? spendable : balances[account];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <p className="text-sm font-medium text-white">Move Galaxy Credits</p>

      {/* Account selector */}
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-black/30 p-1 text-xs">
        {ACCOUNTS.map((a) => (
          <button
            key={a.kind}
            type="button"
            onClick={() => setAccount(a.kind)}
            className={`rounded-full py-2 text-center font-medium transition ${
              account === a.kind
                ? "bg-white text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Direction */}
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
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

      <input type="hidden" name="account" value={account} />
      <input type="hidden" name="op" value={op} />

      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span className="flex items-center justify-between text-white/70">
          <span>Amount (GLXY)</span>
          <span className="text-xs text-white/40">Available: {fmt(available)}</span>
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
            ? "Deposit"
            : "Withdraw to wallet"}
      </button>
    </form>
  );
}
