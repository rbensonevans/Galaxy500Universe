"use client";

import { useEffect, useState } from "react";

function format(d: Date) {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Live-updating current date/time. Seeded with the render-time value (server
// and client differ by a moment, hence suppressHydrationWarning) and ticked
// every second on the client.
export default function StarDate() {
  const [now, setNow] = useState(() => format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time suppressHydrationWarning className="tabular-nums">
      {now}
    </time>
  );
}
