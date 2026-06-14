import AutoRefresh from "./AutoRefresh";

// Always render fresh; never prerender (we hit live network endpoints).
export const dynamic = "force-dynamic";

const BASE_RPC = "https://mainnet.base.org";

type Block = {
  number: string;
  timestamp: string;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;
  transactions: string[];
};

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RPC ${method}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

const toNum = (hex: string) => parseInt(hex, 16);
const gwei = (hex: string) => toNum(hex) / 1e9;

async function getEthPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coinbase.com/v2/prices/ETH-USD/spot",
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const amount = Number(json?.data?.amount);
    return Number.isFinite(amount) ? amount : null;
  } catch {
    return null;
  }
}

type Stats = {
  blockNumber: number;
  gasPriceGwei: number;
  baseFeeGwei: number | null;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  utilization: number;
  blockAgeSeconds: number;
  chainId: number;
  ethPrice: number | null;
};

async function getStats(): Promise<Stats> {
  const [blockHex, gasHex, block, chainHex, ethPrice] = await Promise.all([
    rpc<string>("eth_blockNumber"),
    rpc<string>("eth_gasPrice"),
    rpc<Block>("eth_getBlockByNumber", ["latest", false]),
    rpc<string>("eth_chainId"),
    getEthPrice(),
  ]);

  const gasUsed = toNum(block.gasUsed);
  const gasLimit = toNum(block.gasLimit);

  return {
    blockNumber: toNum(blockHex),
    gasPriceGwei: gwei(gasHex),
    baseFeeGwei: block.baseFeePerGas ? gwei(block.baseFeePerGas) : null,
    txCount: block.transactions.length,
    gasUsed,
    gasLimit,
    utilization: gasLimit > 0 ? (gasUsed / gasLimit) * 100 : 0,
    blockAgeSeconds: Math.max(
      0,
      Math.floor(Date.now() / 1000) - toNum(block.timestamp),
    ),
    chainId: toNum(chainHex),
    ethPrice,
  };
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default async function BlockchainPage() {
  let stats: Stats | null = null;
  let errorMessage: string | null = null;
  try {
    stats = await getStats();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load Base stats.";
  }

  const updated = new Date().toLocaleTimeString();

  return (
    <div>
      <AutoRefresh seconds={20} />

      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0052ff] text-sm font-bold text-white">
          B
        </span>
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
          Blockchain
        </p>
      </div>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Base network stats
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Live data from Base{stats ? ` · Chain ID ${stats.chainId}` : ""} — the
        chain Galaxy500Universe runs on.
        <span className="ml-1 text-white/35">Updated {updated}.</span>
      </p>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          Couldn&apos;t load Base stats: {errorMessage}. It will retry shortly.
        </div>
      ) : (
        stats && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Latest block"
              value={`#${stats.blockNumber.toLocaleString()}`}
              sub={`${stats.blockAgeSeconds}s ago`}
            />
            <StatCard
              label="ETH price"
              value={
                stats.ethPrice != null
                  ? `$${stats.ethPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "—"
              }
              sub="ETH-USD spot"
            />
            <StatCard
              label="Gas price"
              value={`${stats.gasPriceGwei.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })} gwei`}
            />
            <StatCard
              label="Base fee"
              value={
                stats.baseFeeGwei != null
                  ? `${stats.baseFeeGwei.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })} gwei`
                  : "—"
              }
              sub="latest block"
            />
            <StatCard
              label="Transactions"
              value={stats.txCount.toLocaleString()}
              sub="in latest block"
            />
            <StatCard
              label="Block utilization"
              value={`${stats.utilization.toFixed(1)}%`}
              sub={`${stats.gasUsed.toLocaleString()} / ${stats.gasLimit.toLocaleString()} gas`}
            />
          </div>
        )
      )}
    </div>
  );
}
