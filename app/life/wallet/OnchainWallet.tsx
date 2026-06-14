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

// On-chain (Base) side of the wallet page: connect, show address + ETH balance,
// switch network. The off-chain GLXY balance is rendered separately on the page.
export default function OnchainWallet() {
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

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/40 backdrop-blur-md">
        Loading wallet…
      </div>
    );
  }

  if (!isConnected || !address) {
    const connector =
      connectors.find((c) => c.type === "coinbaseWallet") ?? connectors[0];
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm font-medium text-white">On-chain wallet (Base)</p>
        <p className="mt-1 text-sm text-white/50">
          Connect a wallet to hold and bridge Galaxy Credits on Base.
        </p>
        <button
          type="button"
          disabled={isPending || !connector}
          onClick={() => connector && connect({ connector })}
          className="mt-4 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </button>
      </div>
    );
  }

  const wrongNetwork = chainId !== base.id;
  const eth = balance
    ? Number(formatUnits(balance.value, balance.decimals)).toLocaleString(
        undefined,
        { maximumFractionDigits: 5 },
      )
    : "—";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">On-chain wallet (Base)</p>
        <button
          type="button"
          onClick={() => disconnect()}
          className="font-mono text-xs text-white/50 transition hover:text-white"
        >
          {short(address)} · Disconnect
        </button>
      </div>

      {wrongNetwork ? (
        <button
          type="button"
          onClick={() => switchChain({ chainId: base.id })}
          className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
        >
          Wrong network — switch to Base
        </button>
      ) : (
        <p className="mt-4 text-2xl font-bold tabular-nums text-white">
          {eth}{" "}
          <span className="text-base font-medium text-white/50">
            {balance?.symbol ?? "ETH"}
          </span>
        </p>
      )}
    </div>
  );
}
