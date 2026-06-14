import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tickerFor, priceFor, changeFor, formatUsd } from "../market";

type TradePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ side?: string }>;
};

export default async function TradePage({
  params,
  searchParams,
}: TradePageProps) {
  const { id } = await params;
  const { side: rawSide } = await searchParams;
  const side = rawSide === "sell" ? "sell" : "buy";

  const supabase = await createClient();
  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, tagline, description, industry, website")
    .eq("id", id)
    .maybeSingle();

  if (!startup) {
    return (
      <div>
        <Link
          href="/life/stockexchange"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Back to the exchange
        </Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
          This listing couldn&apos;t be found.
        </div>
      </div>
    );
  }

  const ticker = tickerFor(startup.name);
  const price = priceFor(startup.id);
  const change = changeFor(startup.id);
  const up = change >= 0;

  const buyActive = side === "buy";

  return (
    <div className="max-w-2xl">
      <Link
        href="/life/stockexchange"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to the exchange
      </Link>

      {/* Company header */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-violet-500/20 px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-violet-200">
          ${ticker}
        </span>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {startup.name}
        </h1>
      </div>
      {startup.tagline && (
        <p className="mt-1 text-violet-200/80">{startup.tagline}</p>
      )}

      {/* Price */}
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums text-white">
          {formatUsd(price)}
        </span>
        <span
          className={`tabular-nums ${up ? "text-emerald-300" : "text-rose-300"}`}
        >
          {up ? "+" : ""}
          {change.toFixed(2)}% (24h)
        </span>
      </div>

      {/* Trade panel */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
          <Link
            href={`/life/stockexchange/${startup.id}?side=buy`}
            className={`rounded-full py-2 text-center font-medium transition ${
              buyActive ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Buy
          </Link>
          <Link
            href={`/life/stockexchange/${startup.id}?side=sell`}
            className={`rounded-full py-2 text-center font-medium transition ${
              !buyActive ? "bg-rose-500 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Sell
          </Link>
        </div>

        <div className="mt-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">Amount (shares)</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              disabled
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 disabled:cursor-not-allowed"
            />
          </label>

          <button
            type="button"
            disabled
            className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              buyActive ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {buyActive ? "Buy" : "Sell"} ${ticker}
          </button>

          <p className="mt-3 text-center text-xs text-white/40">
            On-chain trading on Base is coming soon. This is a preview of the
            {buyActive ? " buy" : " sell"} flow.
          </p>
        </div>
      </div>
    </div>
  );
}
