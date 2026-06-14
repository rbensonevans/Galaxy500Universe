import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { tickerFor, formatUsd } from "../stockexchange/market";

type HoldingRow = {
  startup_id: string;
  shares: string;
  startups: { name: string } | { name: string }[] | null;
};

function startupName(row: HoldingRow): string {
  const s = row.startups;
  if (!s) return "Unknown";
  return Array.isArray(s) ? (s[0]?.name ?? "Unknown") : s.name;
}

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: rows, error } = await supabase
    .from("share_holdings")
    .select("startup_id, shares, startups(name)")
    .eq("user_id", me)
    .gt("shares", 0);

  const setupNeeded = isMissingTableError(error);
  const holdings = (rows ?? []) as HoldingRow[];

  // Current engagement-driven price per held startup.
  const priced = await Promise.all(
    holdings.map(async (h) => {
      const { data: price } = await supabase.rpc("startup_price", {
        p_startup: h.startup_id,
      });
      const shares = Number(h.shares);
      const unit = Number(price ?? 0);
      return {
        id: h.startup_id,
        name: startupName(h),
        shares,
        price: unit,
        value: shares * unit,
      };
    }),
  );
  priced.sort((a, b) => b.value - a.value);
  const total = priced.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Portfolio
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Your share holdings
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Equity you hold across Galaxy500Universe startups, valued at each
        company&apos;s current engagement-driven price.
      </p>

      {setupNeeded && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run <code className="rounded bg-black/30 px-1">supabase/SETUP.sql</code>{" "}
            in your Supabase SQL Editor to enable trading and holdings.
          </p>
        </div>
      )}

      {!setupNeeded && (
        <>
          <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-500/10 p-6 backdrop-blur-md">
            <p className="text-sm font-medium text-white/70">
              Total portfolio value
            </p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-white">
              {formatUsd(total)}{" "}
              <span className="text-lg font-semibold text-white/50">GLXY</span>
            </p>
            <p className="mt-1 text-xs text-white/40">
              {priced.length} holding{priced.length === 1 ? "" : "s"}
            </p>
          </div>

          {priced.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
              You don&apos;t hold any shares yet. Visit the{" "}
              <Link
                href="/life/stockexchange"
                className="text-violet-300 hover:text-violet-200"
              >
                Stock Exchange
              </Link>{" "}
              to invest in a startup.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="hidden grid-cols-12 gap-4 border-b border-white/10 px-5 py-3 text-xs font-medium uppercase tracking-wider text-white/40 sm:grid">
                <span className="col-span-5">Company</span>
                <span className="col-span-2 text-right">Shares</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-3 text-right">Value</span>
              </div>
              <ul className="divide-y divide-white/10">
                {priced.map((p) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-12 sm:gap-4"
                  >
                    <div className="col-span-2 min-w-0 sm:col-span-5">
                      <Link
                        href={`/life/stockexchange/${p.id}`}
                        className="flex items-center gap-2 hover:opacity-90"
                      >
                        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-violet-200">
                          ${tickerFor(p.name)}
                        </span>
                        <span className="truncate font-semibold text-white">
                          {p.name}
                        </span>
                      </Link>
                    </div>
                    <div className="text-right tabular-nums text-white/80 sm:col-span-2">
                      <span className="text-xs text-white/40 sm:hidden">Shares </span>
                      {p.shares.toLocaleString()}
                    </div>
                    <div className="text-right tabular-nums text-white/80 sm:col-span-2">
                      <span className="text-xs text-white/40 sm:hidden">Price </span>
                      {formatUsd(p.price)}
                    </div>
                    <div className="text-right font-semibold tabular-nums text-white sm:col-span-3">
                      <span className="text-xs text-white/40 sm:hidden">Value </span>
                      {formatUsd(p.value)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
