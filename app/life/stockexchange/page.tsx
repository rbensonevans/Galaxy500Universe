import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import { tickerFor, formatUsd } from "./market";

type Listing = {
  id: string;
  name: string;
  tagline: string | null;
  industry: string | null;
};

type MarketRow = {
  startup_id: string;
  price: string;
  change_24h: string;
  available: string;
  tradable: boolean;
};

export default async function StockExchangePage() {
  const supabase = await createClient();
  const [{ data, error }, { data: marketRows }] = await Promise.all([
    supabase
      .from("startups")
      .select("id, name, tagline, industry")
      .order("name", { ascending: true }),
    supabase.rpc("startup_market"),
  ]);

  const tableMissing = isMissingTableError(error);
  const listings = (data ?? []) as Listing[];
  const market = new Map<string, MarketRow>(
    ((marketRows ?? []) as MarketRow[]).map((m) => [m.startup_id, m]),
  );

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Galaxy500 Stock Exchange
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Trade startups on Base
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        A decentralized exchange for the companies built across
        Galaxy500Universe. Browse listings and trade shares.
      </p>

      {tableMissing && (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            The <code className="rounded bg-black/30 px-1">startups</code> table
            doesn&apos;t exist yet. Run{" "}
            <code className="rounded bg-black/30 px-1">supabase/SETUP.sql</code>{" "}
            in your Supabase SQL Editor.
          </p>
        </div>
      )}

      {error && !tableMissing && (
        <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          Couldn&apos;t load listings: {error.message}
        </div>
      )}

      {!tableMissing &&
        (listings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-white/50">
            No startups are listed yet.{" "}
            <Link
              href="/life/startups/register"
              className="text-violet-300 hover:text-violet-200"
            >
              Register one
            </Link>{" "}
            to be the first on the exchange.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            {/* Header row (desktop) */}
            <div className="hidden grid-cols-12 gap-4 border-b border-white/10 px-5 py-3 text-xs font-medium uppercase tracking-wider text-white/40 sm:grid">
              <span className="col-span-5">Company</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">24h</span>
              <span className="col-span-3 text-right">Trade</span>
            </div>

            <ul className="divide-y divide-white/10">
              {listings.map((s) => {
                const ticker = tickerFor(s.name);
                const m = market.get(s.id);
                const price = m ? Number(m.price) : 1;
                const change = m ? Number(m.change_24h) : 0;
                const tradable = m ? m.tradable : false;
                const up = change >= 0;
                return (
                  <li
                    key={s.id}
                    className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-12 sm:gap-4"
                  >
                    {/* Company */}
                    <div className="col-span-2 min-w-0 sm:col-span-5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-violet-200">
                          ${ticker}
                        </span>
                        <span className="truncate font-semibold text-white">
                          {s.name}
                        </span>
                      </div>
                      {(s.tagline || s.industry) && (
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {s.tagline || s.industry}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right tabular-nums text-white sm:col-span-2">
                      <span className="text-xs text-white/40 sm:hidden">
                        Price{" "}
                      </span>
                      {formatUsd(price)}
                    </div>

                    {/* 24h change */}
                    <div
                      className={`text-right tabular-nums sm:col-span-2 ${
                        up ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {up ? "+" : ""}
                      {change.toFixed(2)}%
                    </div>

                    {/* Trade actions */}
                    <div className="col-span-2 flex justify-end gap-2 sm:col-span-3">
                      {tradable ? (
                        <>
                          <Link
                            href={`/life/stockexchange/${s.id}?side=buy`}
                            className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                          >
                            Buy
                          </Link>
                          <Link
                            href={`/life/stockexchange/${s.id}?side=sell`}
                            className="rounded-lg bg-rose-500/90 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-400"
                          >
                            Sell
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/life/stockexchange/${s.id}`}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/50 transition hover:bg-white/10"
                          title="Not yet funded — no equity on the market"
                        >
                          Not listed
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

      <p className="mt-4 text-xs text-white/30">
        Prices are driven by each company&apos;s feed activity — posts, comments,
        and reactions. Startups become tradable once funded.
      </p>
    </div>
  );
}
