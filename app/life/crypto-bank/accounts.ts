export type AccountKind = "checking" | "savings" | "money_market";

export const ACCOUNTS: {
  kind: AccountKind;
  name: string;
  blurb: string;
  accent: string;
}[] = [
  {
    kind: "checking",
    name: "Checking",
    blurb: "Daily transactions",
    accent: "from-sky-500/20 to-cyan-500/10",
  },
  {
    kind: "savings",
    name: "Savings",
    blurb: "Steady growth",
    accent: "from-emerald-500/20 to-cyan-500/10",
  },
  {
    kind: "money_market",
    name: "Money Market",
    blurb: "Stock-related investments",
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
];

export const ACCOUNT_NAMES: Record<AccountKind, string> = {
  checking: "Checking",
  savings: "Savings",
  money_market: "Money Market",
};

export const DEFAULT_RATE: Record<AccountKind, number> = {
  checking: 0,
  savings: 0.05,
  money_market: 0.1,
};
