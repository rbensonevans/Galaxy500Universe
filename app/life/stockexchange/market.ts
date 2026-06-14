// Display helpers for the Galaxy500 Stock Exchange. Prices/changes come from
// the server's engagement-driven valuation (startup_market RPC); this file only
// derives tickers and formats currency.

export function tickerFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let t =
    words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? "");
  t = t.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (t.length < 3) {
    t = (words[0] ?? "STAR").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  return (t || "STAR").slice(0, 5);
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
