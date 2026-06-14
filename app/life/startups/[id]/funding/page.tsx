import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tickerFor } from "../../../stockexchange/market";
import FundingPanel from "./FundingPanel";

type FundingTxn = {
  id: string;
  amount: string;
  kind: string;
  shares_pledged: string;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  initial: "Initial funding",
  annual: "Annual funding",
  repayment: "Repayment",
};

function fmt(n: number, dp = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function FundingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: startup } = await supabase
    .from("startups")
    .select(
      "id, name, tagline, user_id, total_shares, pledged_shares, outstanding_funding, funding_price, last_funding_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!startup) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/life/startups" className="text-sm text-white/50 hover:text-white">
          ← Startups
        </Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
          This startup couldn&apos;t be found.
        </div>
      </div>
    );
  }

  // Funding is founder-only.
  if (startup.user_id !== me) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/life/startups/${id}`} className="text-sm text-white/50 hover:text-white">
          ← {startup.name}
        </Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
          Only the founder can manage funding for this startup.
        </div>
      </div>
    );
  }

  const { data: txnRows } = await supabase
    .from("startup_funding")
    .select("id, amount, kind, shares_pledged, created_at")
    .eq("startup_id", id)
    .order("created_at", { ascending: false });
  const txns = (txnRows ?? []) as FundingTxn[];

  const total = Number(startup.total_shares);
  const pledged = Number(startup.pledged_shares);
  const outstanding = Number(startup.outstanding_funding);
  const price = Number(startup.funding_price);
  const availableEquity = total - pledged;
  const maxRaise = availableEquity * price;

  // Annual funding requires >= 365 days since the last draw. The request_funding
  // SQL function is the authoritative enforcer; here we just show the next date.
  let nextDate: string | null = null;
  if (startup.last_funding_at) {
    const next = new Date(startup.last_funding_at);
    next.setDate(next.getDate() + 365);
    nextDate = fmtDate(next.toISOString());
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/life/startups/${id}`}
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        {startup.name}
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Funding
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-violet-500/20 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-violet-200">
          ${tickerFor(startup.name)}
        </span>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {startup.name}
        </h1>
      </div>
      <p className="mt-3 max-w-xl text-white/60">
        Request funding from Galaxy500Universe and pledge shares in return.
        Repay anytime to release pledged equity.
      </p>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Outstanding", value: `${fmt(outstanding)} GLXY` },
          { label: "Shares pledged", value: fmt(pledged, 0) },
          { label: "Equity available", value: fmt(availableEquity, 0) },
          { label: "Max raise", value: `${fmt(maxRaise)} GLXY` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              {s.label}
            </p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-white">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-white/40">
        {startup.last_funding_at == null
          ? "Eligible for initial funding."
          : `Annual funding available from ${nextDate}.`}{" "}
        Funding price: {fmt(price)} GLXY/share.
      </p>

      <div className="mt-6">
        <FundingPanel startupId={startup.id} outstanding={outstanding} />
      </div>

      {/* History */}
      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-[0.25em] text-white/50">
          Funding history
        </h2>
        {txns.length === 0 ? (
          <p className="mt-4 text-sm text-white/40">No funding activity yet.</p>
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
                    <p className="text-xs text-white/40">
                      {fmtDate(t.created_at)} ·{" "}
                      {fmt(Math.abs(Number(t.shares_pledged)), 0)} shares{" "}
                      {positive ? "pledged" : "released"}
                    </p>
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
