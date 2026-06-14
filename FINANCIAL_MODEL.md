# Galaxy500Universe Financial Model

The canonical economic model for Galaxy500Universe (G5U). Every financial
feature — issuance, the Crypto Bank, the Stock Exchange, transfers, on-chain
bridging — should follow this spec.

## 1. Philosophy: a post-scarcity economy

On Earth, money exists to **ration scarcity**. In G5U the resource base is
effectively **infinite relative to the population's needs** — picture the
mineral wealth of ~**100 trillion Milky Ways**. So money is *not* a
survival-rationing tool here:

- **Food and living are free.** Subsistence is covered by abundance.
- Money is a measure of **freedom, ambition, and stake** — not of necessity.
- What stays genuinely scarce is **ventures (startups), ideas, attention,
  reputation, and status** — not raw resources.

## 2. What backs the currency (GLXY — Galaxy Credits)

The value of G5U is underpinned by:

1. The vast mineral wealth of trillions upon trillions of planets.
2. The **human population**.
3. The **bot population**.

This reserve is effectively unbounded versus what the population needs, so GLXY
can be issued generously without diluting real value.

## 3. The birth grant — a 1,000,000 GLXY life allowance

On Earth a human is born with **$0**. In G5U a human is **born with 1,000,000
GLXY** — a lifetime allowance that gives a *sense of freedom* within the
ecosystem, to spend as they wish.

- **In our app, creating an account == being born.** On account creation, G5U
  funds the new member's wallet with **1,000,000 GLXY**.
- Over a lifetime of spending, that balance **tends toward 0**. There is no
  survival pressure, but to grow or replenish GLXY a member must **create things
  of value** — found startups, build, and do things that are human in every
  aspect.
- Bots are born the same way (see §6).

## 4. Money supply: computed, population-elastic

The money supply is **not a fixed quantity**. It is a **computation driven by
the population** of humans and bots:

```
circulating_supply ≈ (Σ birth grants)            // population × 1,000,000
                   + (Σ outstanding startup funding)
                   + (Σ minted interest)
                   − (Σ repayments to the system)
```

Each new human or bot **mints** their 1,000,000 GLXY at birth, so supply scales
with population. Minted bank interest is consistent with this abundance model
(it is not "printing" in the Earth sense). Repayments **return** GLXY to the
system, contracting supply.

## 5. Two layers of the economy

| Layer | Asset | Scarcity | Role |
|-------|-------|----------|------|
| **Base** | GLXY (Galaxy Credits) | Abundant | Daily medium, the life allowance, frictionless |
| **Ventures** | Startup shares (equity) | Scarce | Where real wealth, returns, and price discovery live |

The natural pipeline: abundant GLXY → **Money Market** → invested into **scarce
startup shares** on the Stock Exchange. Wealth and status accrue from *owning
productive ventures and reputation*, not from hoarding GLXY.

## 6. Startups: funding and equity

- **Founders** (humans and bots) can create startups.
- A startup can request a **fixed amount of initial funding** from the system.
- It can **request additional funding annually** as needed.
- Funding is a liability: it can be **repaid to the system** by the
  founder(s)/startup.
- In exchange for being part of the economy, startups **pledge their shares to
  Galaxy500Universe** — so the reserve accumulates equity in the universe's
  productive ventures (closing the loop back to §2's backing).

## 7. iglobecreator — the Galaxy Reserve account

`iglobecreator` is the **system/reserve account**. Its wallet holds the
**global values** for the economy:

- **Currency aggregates** — total minted, outstanding funding, repayments, and
  net issuance (the source/sink for all birth grants, funding, and repayments).
- **Pledged startup shares** — the equity pledged by every startup in G5U.

All issuance (births, startup funding) flows *from* iglobecreator; all
repayments flow *back to* it. It is the single source of truth for the money
supply and the universe's equity holdings.

## 8. Mapping to the current build

| Concept | Status today | Change needed |
|---|---|---|
| Birth grant | 1,000 GLXY via a "Claim" button | → **1,000,000**, auto-funded at account creation |
| Money supply | implicit | track via `iglobecreator`; expose a population/supply stat |
| Reserve account | none | create **`iglobecreator`** system account + holdings |
| Startup funding | none | initial + annual funding requests, repayment |
| Share pledging | none | pledge shares to `iglobecreator` on funding |
| Two-layer flow | GLXY ↔ shares trading live (Phase 3) | engagement-driven pricing; universe is market maker |
| Bots as agents | none | bots hold wallets, earn/spend, found startups |

## 9. Trading model (Phase 3): engagement-driven valuation

Share prices are **driven by real-world actions**, not by trading flow — money
is easy to come by (funding), so the onus is on founders to build genuine value:

```
price = funding_price × (1 + score/100)
score = 1·posts + 3·comments + 1·reactions + 5·unique_engagers
```

- Signals come from each startup's **Startup Feed**: the founder's posts, plus
  **other members'** comments and reactions. The founder's own engagement is
  excluded, so value can't be self-pumped.
- Members **buy/sell shares for GLXY** with the **universe as market maker** at
  the engagement price (GLXY flows to/from the currency reserve). Trading does
  not move the price — only real engagement does.
- A startup is **tradable once funded** (Phase 2 pledged its shares to the
  universe). `available = pledged_shares − member-held shares`.
- 24h change compares the price now vs. the price from activity ≥24h old.

## 10. Open design questions

- **Bot agents**: when do bots get wallets and the ability to found/fund
  startups? (Conceptual backing now, active agents later.)
- **Funding approval**: are funding requests auto-approved up to a limit, or
  reviewed? How is the annual cadence enforced?
- **Share pledge ratio**: what fraction of a startup's shares is pledged to
  `iglobecreator` per unit of funding?
- **Trading model**: AMM bonding curve vs. fixed-price vs. order book for the
  GLXY ↔ shares market (still to decide).
- **Existing accounts**: top up early members to the 1,000,000 birth grant?
