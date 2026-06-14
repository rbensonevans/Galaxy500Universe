import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { claimWelcomeBonus } from "./actions";
import OnchainWallet from "./OnchainWallet";

type Txn = {
  id: string;
  amount: string;
  kind: string;
  memo: string | null;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  welcome_bonus: "Welcome bonus",
  transfer_in: "Received",
  transfer_out: "Sent",
  purchase: "Purchase",
};

function fmtGlxy(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", me)
    .maybeSingle();

  const tableMissing = isMissingTableError(error);

  const { data: txnRows } = !tableMissing
    ? await supabase
        .from("wallet_transactions")
        .select("id, amount, kind, memo, created_at")
        .eq("user_id", me)
        .order("created_at", { ascending: false })
        .limit(25)
    : { data: [] };
  const txns = (txnRows ?? []) as Txn[];

  const balance = wallet ? Number(wallet.balance) : null;

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Wallet
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Your wallet
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Galaxy Credits (GLXY) is the currency of Galaxy500Universe. Held
        off-chain today, with on-chain settlement on Base coming soon.
      </p>

      {tableMissing && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            The wallet tables don&apos;t exist yet. In your Supabase dashboard,
            run{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0005_wallet.sql
            </code>{" "}
            (or the full <code className="rounded bg-black/30 px-1">SETUP.sql</code>).
          </p>
        </div>
      )}

      {!tableMissing && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Galaxy Credits balance */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 p-6 backdrop-blur-md">
            <p className="text-sm font-medium text-white/70">Galaxy Credits</p>
            {balance == null ? (
              <div className="mt-4">
                <p className="text-sm text-white/50">
                  Claim your welcome credits to get started.
                </p>
                <form action={claimWelcomeBonus} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
                  >
                    Claim 1,000 GLXY
                  </button>
                </form>
              </div>
            ) : (
              <p className="mt-3 text-4xl font-bold tabular-nums text-white">
                {fmtGlxy(balance)}{" "}
                <span className="text-lg font-semibold text-white/50">GLXY</span>
              </p>
            )}
          </div>

          {/* On-chain wallet */}
          <OnchainWallet />
        </div>
      )}

      {/* Transaction history */}
      {!tableMissing && balance != null && (
        <div className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-white/50">
            Activity
          </h2>
          {txns.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">No transactions yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              {txns.map((t) => {
                const amt = Number(t.amount);
                const credit = amt >= 0;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {KIND_LABELS[t.kind] ?? t.kind}
                      </p>
                      <p className="text-xs text-white/40">
                        {t.memo ? `${t.memo} · ` : ""}
                        {fmtWhen(t.created_at)}
                      </p>
                    </div>
                    <span
                      className={`tabular-nums text-sm font-semibold ${
                        credit ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {fmtGlxy(Math.abs(amt))} GLXY
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
