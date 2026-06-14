import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tickerFor, priceFor, changeFor, formatUsd } from "../market";
import TradePanel from "./TradePanel";

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

      {/* Trade panel (wallet-aware) */}
      <div className="mt-8">
        <TradePanel
          ticker={ticker}
          price={price}
          initialSide={buyActive ? "buy" : "sell"}
        />
      </div>
    </div>
  );
}
