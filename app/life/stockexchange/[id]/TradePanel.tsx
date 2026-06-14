"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ConnectWallet from "@/app/components/ConnectWallet";
import { formatUsd } from "../market";

export default function TradePanel({
  ticker,
  price,
  initialSide,
}: {
  ticker: string;
  price: number;
  initialSide: "buy" | "sell";
}) {
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { isConnected } = useAccount();

  const buy = side === "buy";
  const qty = Math.max(0, Number(amount) || 0);
  const total = qty * price;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1 text-sm">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`rounded-full py-2 text-center font-medium transition ${
            buy ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`rounded-full py-2 text-center font-medium transition ${
            !buy ? "bg-rose-500 text-white" : "text-white/70 hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      {!isConnected ? (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-white/60">
            Connect your wallet to trade ${ticker} on Base.
          </p>
          <ConnectWallet />
        </div>
      ) : (
        <div className="mt-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">Amount (shares)</span>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setStatus(null);
              }}
              placeholder="0"
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
            />
          </label>

          <div className="mt-3 flex justify-between text-sm text-white/50">
            <span>Estimated total</span>
            <span className="tabular-nums text-white/80">
              {formatUsd(total)}
            </span>
          </div>

          <button
            type="button"
            disabled={qty <= 0}
            onClick={() =>
              setStatus(
                `On-chain settlement on Base is coming soon. Your ${side} of ${qty} $${ticker} (${formatUsd(
                  total,
                )}) would execute here.`,
              )
            }
            className={`mt-4 w-full rounded-lg px-4 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              buy
                ? "bg-emerald-500 hover:bg-emerald-400"
                : "bg-rose-500 hover:bg-rose-400"
            }`}
          >
            {buy ? "Buy" : "Sell"} ${ticker}
          </button>

          {status && (
            <p className="mt-3 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-center text-xs text-violet-100">
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
