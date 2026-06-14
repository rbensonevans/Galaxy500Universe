import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { collectInterest } from "./actions";
import BankPanel from "./BankPanel";
import AccruingInterest from "./AccruingInterest";
import {
  ACCOUNTS,
  ACCOUNT_NAMES,
  DEFAULT_RATE,
  type AccountKind,
} from "./accounts";

type BankTxn = {
  id: string;
  account: string;
  amount: string;
  kind: string;
  created_at: string;
};

type AccountRow = {
  kind: string;
  balance: string;
  rate: string;
  accrued_at: string;
};

const KIND_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdrawal",
  interest: "Interest",
};

const EPOCH = "1970-01-01T00:00:00.000Z";

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

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", me)
    .maybeSingle();

  const { data: accountRows, error: accountsError } = await supabase
    .from("bank_accounts")
    .select("kind, balance, rate, accrued_at")
    .eq("user_id", me);

  const setupNeeded =
    isMissingTableError(walletError) ||
    walletError?.code === "42703" ||
    isMissingTableError(accountsError) ||
    accountsError?.code === "42703";

  const { data: txnRows } = !setupNeeded
    ? await supabase
        .from("bank_transactions")
        .select("id, account, amount, kind, created_at")
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
        Bank your Galaxy Credits
      </h1>
    </>
  );

  if (setupNeeded) {
    return (
      <div className="max-w-4xl">
        {Heading}
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run <code className="rounded bg-black/30 px-1">supabase/SETUP.sql</code>{" "}
            in your Supabase SQL Editor to create the bank accounts and functions.
          </p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-4xl">
        {Heading}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          You don&apos;t have a wallet yet.{" "}
          <Link href="/life/wallet" className="text-violet-300 hover:text-violet-200">
            Claim your Galaxy Credits
          </Link>{" "}
          first, then come back to start banking.
        </div>
      </div>
    );
  }

  const spendable = Number(wallet.balance);

  // Map each account kind to its row (defaulting missing accounts to zero).
  const rowByKind = new Map<string, AccountRow>();
  for (const r of (accountRows ?? []) as AccountRow[]) rowByKind.set(r.kind, r);

  const accounts = ACCOUNTS.map((meta) => {
    const row = rowByKind.get(meta.kind);
    return {
      ...meta,
      balance: row ? Number(row.balance) : 0,
      rate: row ? Number(row.rate) : DEFAULT_RATE[meta.kind],
      accruedAt: row?.accrued_at ?? EPOCH,
    };
  });

  const balances = Object.fromEntries(
    accounts.map((a) => [a.kind, a.balance]),
  ) as Record<AccountKind, number>;

  return (
    <div className="max-w-4xl">
      {Heading}
      <p className="mt-3 max-w-2xl text-white/60">
        Checking for daily transactions, Savings at 5% APY, and a Money Market
        account at 10% APY for stock-related investing.
      </p>

      {/* Account cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {accounts.map((a) => (
          <div
            key={a.kind}
            className={`rounded-2xl border border-white/10 bg-gradient-to-br ${a.accent} p-5 backdrop-blur-md`}
          >
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-white">{a.name}</p>
              <span className="text-xs text-white/50">{fmt(a.rate * 100, 1)}% APY</span>
            </div>
            <p className="mt-0.5 text-xs text-white/40">{a.blurb}</p>
            <p className="mt-3 text-2xl font-bold tabular-nums text-white">
              {fmt(a.balance)}{" "}
              <span className="text-sm font-semibold text-white/50">GLXY</span>
            </p>
            {a.rate > 0 && (
              <>
                <p className="mt-1 text-xs text-emerald-200/80">
                  <AccruingInterest
                    savings={a.balance}
                    rate={a.rate}
                    accruedAt={a.accruedAt}
                  />
                </p>
                <form action={collectInterest} className="mt-3">
                  <input type="hidden" name="account" value={a.kind} />
                  <button
                    type="submit"
                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                  >
                    Collect interest
                  </button>
                </form>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Move funds + spendable */}
      <div className="mt-6 max-w-md">
        <BankPanel spendable={spendable} balances={balances} />
        <p className="mt-2 text-center text-xs text-white/40">
          Spendable wallet: {fmt(spendable)} GLXY
        </p>
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
              const accountName =
                ACCOUNT_NAMES[t.account as AccountKind] ?? t.account;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {accountName} · {KIND_LABELS[t.kind] ?? t.kind}
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
