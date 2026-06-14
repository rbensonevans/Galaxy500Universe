import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { collectInterest } from "./actions";
import BankPanel from "./BankPanel";
import AccruingInterest from "./AccruingInterest";

type BankTxn = {
  id: string;
  amount: string;
  kind: string;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdrawal",
  interest: "Interest",
};

function fmt(n: number, dp = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CryptoBankPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("balance, savings_balance, savings_rate, savings_accrued_at")
    .eq("user_id", me)
    .maybeSingle();

  const setupNeeded =
    isMissingTableError(error) || error?.code === "42703";

  const { data: txnRows } = !setupNeeded
    ? await supabase
        .from("bank_transactions")
        .select("id, amount, kind, created_at")
        .eq("user_id", me)
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] };
  const txns = (txnRows ?? []) as BankTxn[];

  const Heading = (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Galaxy500 Crypto Bank
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Save your Galaxy Credits
      </h1>
    </>
  );

  if (setupNeeded) {
    return (
      <div className="max-w-3xl">
        {Heading}
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run <code className="rounded bg-black/30 px-1">supabase/SETUP.sql</code>{" "}
            in your Supabase SQL Editor to create the bank tables and functions.
          </p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-3xl">
        {Heading}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          You don&apos;t have a wallet yet.{" "}
          <Link
            href="/life/wallet"
            className="text-violet-300 hover:text-violet-200"
          >
            Claim your Galaxy Credits
          </Link>{" "}
          first, then come back to start saving.
        </div>
      </div>
    );
  }

  const spendable = Number(wallet.balance);
  const savings = Number(wallet.savings_balance);
  const rate = Number(wallet.savings_rate);

  return (
    <div className="max-w-3xl">
      {Heading}
      <p className="mt-3 max-w-xl text-white/60">
        Deposit GLXY to earn {fmt(rate * 100, 1)}% APY. Withdraw back to your
        wallet anytime.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Savings */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 p-6 backdrop-blur-md">
          <p className="text-sm font-medium text-white/70">Savings balance</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-white">
            {fmt(savings)} <span className="text-lg font-semibold text-white/50">GLXY</span>
          </p>
          <p className="mt-2 text-xs text-emerald-200/80">
            <AccruingInterest
              savings={savings}
              rate={rate}
              accruedAt={wallet.savings_accrued_at}
            />{" "}
            · {fmt(rate * 100, 1)}% APY
          </p>
          <form action={collectInterest} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Collect interest
            </button>
          </form>
        </div>

        {/* Deposit / withdraw */}
        <div>
          <BankPanel spendable={spendable} savings={savings} />
          <p className="mt-2 text-center text-xs text-white/40">
            Spendable wallet: {fmt(spendable)} GLXY
          </p>
        </div>
      </div>

      {/* Activity */}
      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-white/50">
          Bank activity
        </h2>
        {txns.length === 0 ? (
          <p className="mt-4 text-sm text-white/40">No bank activity yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            {txns.map((t) => {
              const amt = Number(t.amount);
              const positive = amt >= 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {KIND_LABELS[t.kind] ?? t.kind}
                    </p>
                    <p className="text-xs text-white/40">{fmtWhen(t.created_at)}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      positive ? "text-emerald-300" : "text-white/60"
                    }`}
                  >
                    {positive ? "+" : "−"}
                    {fmt(Math.abs(amt))} GLXY
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
