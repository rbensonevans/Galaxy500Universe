import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function ExchangeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function BankIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10l9-6 9 6" />
      <path d="M4 10h16v9H4z" />
      <path d="M8 19v-6M12 19v-6M16 19v-6M3 21h18" />
    </svg>
  );
}

function WalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BlockchainIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

export type CryptoLink = {
  name: string;
  href: string;
  blurb: string;
  icon: ComponentType<IconProps>;
  accent: string;
};

export const CRYPTO_LINKS: CryptoLink[] = [
  {
    name: "Galaxy500 Stock Exchange",
    href: "/life/stockexchange",
    blurb: "Trade startup shares on the DEX.",
    icon: ExchangeIcon,
    accent: "from-violet-500/30 to-fuchsia-500/10",
  },
  {
    name: "Galaxy500 Crypto Bank",
    href: "/life/crypto-bank",
    blurb: "Checking, savings, and money market accounts.",
    icon: BankIcon,
    accent: "from-emerald-500/30 to-cyan-500/10",
  },
  {
    name: "Wallet",
    href: "/life/wallet",
    blurb: "Your Galaxy Credits and on-chain Base wallet.",
    icon: WalletIcon,
    accent: "from-sky-500/30 to-violet-500/10",
  },
  {
    name: "Blockchain",
    href: "/life/blockchain",
    blurb: "Live Base network stats.",
    icon: BlockchainIcon,
    accent: "from-amber-500/30 to-rose-500/10",
  },
  {
    name: "Send Galaxy Credits",
    href: "/life/profile/transfer",
    blurb: "Transfer GLXY to another member by @handle.",
    icon: SendIcon,
    accent: "from-fuchsia-500/30 to-indigo-500/10",
  },
];
