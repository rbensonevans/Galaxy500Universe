"use client";

// Made during the XRP LEDGER HACKATHON
import { useEffect, useRef } from "react";

// Keeps the chat scrolled to the newest message whenever the count changes.
export default function ScrollToEnd({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, [count]);
  return <div ref={ref} />;
}
