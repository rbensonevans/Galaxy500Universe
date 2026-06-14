import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { tickerFor, formatUsd } from "../market";
import TradePanel from "./TradePanel";

type TradePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ side?: string }>;
};

type MarketRow = {
  startup_id: string;
  price: string;
  change_24h: string;
  score: string;
  available: string;
  tradable: boolean;
};

export default async function TradePage({
  params,
  searchParams,
}: TradePageProps) {
  const { id } = await params;
  const { side: rawSide } = await searchParams;
  const side = rawSide === "sell" ? "sell" : "buy";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, tagline")
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

  // Engagement-driven market data + the member's current holding.
  const [{ data: marketRows }, { data: holdingRow }] = await Promise.all([
    supabase.rpc("startup_market"),
    supabase
      .from("share_holdings")
      .select("shares")
      .eq("startup_id", id)
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);
  const market = ((marketRows ?? []) as MarketRow[]).find(
    (m) => m.startup_id === id,
  );

  const ticker = tickerFor(startup.name);
  const price = market ? Number(market.price) : 1;
  const change = market ? Number(market.change_24h) : 0;
  const available = market ? Number(market.available) : 0;
  const tradable = market ? market.tradable : false;
  const holding = holdingRow ? Number(holdingRow.shares) : 0;
  const up = change >= 0;

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

      <Link
        href={`/life/startups/${startup.id}`}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-cyan-300/80 transition hover:text-cyan-200"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        View company feed
      </Link>

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
      <p className="mt-1 text-xs text-white/40">
        Price is driven by feed activity — the company&apos;s posts and members&apos;
        comments and reactions. Build value to raise it.
      </p>
      {holding > 0 && (
        <p className="mt-2 text-sm text-white/60">
          You hold{" "}
          <span className="font-semibold text-white">
            {holding.toLocaleString()}
          </span>{" "}
          shares · {formatUsd(holding * price)}
        </p>
      )}

      {/* Trade panel */}
      <div className="mt-8">
        <TradePanel
          startupId={startup.id}
          ticker={ticker}
          price={price}
          available={available}
          holding={holding}
          tradable={tradable}
          initialSide={side}
        />
      </div>
    </div>
  );
}
