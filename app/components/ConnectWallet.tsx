"use client";

import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";
import { formatUnits } from "viem";
import { useMounted } from "@/lib/useMounted";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectWallet() {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: base.id,
    query: { enabled: Boolean(address) },
  });

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/50">
        Wallet
      </span>
    );
  }

  if (!isConnected || !address) {
    const connector =
      connectors.find((c) => c.type === "coinbaseWallet") ?? connectors[0];
    return (
      <button
        type="button"
        disabled={isPending || !connector}
        onClick={() => connector && connect({ connector })}
        className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  const wrongNetwork = chainId !== base.id;

  return (
    <div className="flex items-center gap-2">
      {wrongNetwork ? (
        <button
          type="button"
          onClick={() => switchChain({ chainId: base.id })}
          className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
        >
          Switch to Base
        </button>
      ) : (
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 tabular-nums sm:inline">
          {balance
            ? `${Number(
                formatUnits(balance.value, balance.decimals),
              ).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })} ${balance.symbol}`
            : "Base"}
        </span>
      )}
      <button
        type="button"
        onClick={() => disconnect()}
        title="Disconnect"
        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        {short(address)}
      </button>
    </div>
  );
}
