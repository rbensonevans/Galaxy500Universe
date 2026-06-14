"use client";

import { useEffect, useState } from "react";

const YEAR_MS = 31_536_000_000;

function calc(savings: number, rate: number, accruedAtIso: string) {
  const since = Date.now() - new Date(accruedAtIso).getTime();
  return Math.max(0, (savings * rate * since) / YEAR_MS);
}

// Live read-only projection of interest accrued since the last capitalization.
// Ticks every second; the actual balance updates when interest is collected
// (or on the next deposit/withdraw).
export default function AccruingInterest({
  savings,
  rate,
  accruedAt,
}: {
  savings: number;
  rate: number;
  accruedAt: string;
}) {
  const [pending, setPending] = useState(() => calc(savings, rate, accruedAt));

  useEffect(() => {
    const id = setInterval(
      () => setPending(calc(savings, rate, accruedAt)),
      1000,
    );
    return () => clearInterval(id);
  }, [savings, rate, accruedAt]);

  return (
    <span suppressHydrationWarning>
      +
      {pending.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      })}{" "}
      GLXY accruing
    </span>
  );
}
