import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

// wagmi configuration for the Base network. Uses the browser/injected wallet
// when available and Coinbase Wallet (incl. Smart Wallet, no extension needed)
// as the default connector — a natural fit since Base is Coinbase's L2.
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Galaxy500Universe", preference: "all" }),
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
