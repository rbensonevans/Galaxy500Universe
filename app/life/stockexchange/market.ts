// Market helpers for the Galaxy500 Stock Exchange.
//
// Pricing is currently DERIVED deterministically from each startup's id so the
// exchange has stable, plausible numbers to display. This is a placeholder
// until trading is settled on-chain on Base, at which point price/volume will
// come from the on-chain market instead.

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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Stable price in the range $1.00–$100.00.
export function priceFor(id: string): number {
  return Math.round((1 + (hash(id) % 9900) / 100) * 100) / 100;
}

// Stable 24h change in the range -10.00%…+10.00%.
export function changeFor(id: string): number {
  return Math.round(((hash(id + "chg") % 2000) / 100 - 10) * 100) / 100;
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
