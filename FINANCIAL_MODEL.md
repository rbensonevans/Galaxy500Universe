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

## 3. Monthly grants — 1,200,000 GLXY over the first 50 years

On Earth a human is born with **$0**. In G5U a citizen receives **Galaxy
Credits every month from birth**: **2,000 GLXY on the 1st of every month for
the first 50 years** (600 months) — a guaranteed lifetime allowance of
**1,200,000 GLXY** that gives a *sense of freedom* within the ecosystem.

- **In our app, creating an account == being born.** The first 2,000 GLXY is
  granted at birth (month 1); each later grant arrives on the 1st of the month
  (00:00 UTC), minted from the currency reserve.
- **`issued_grants`** tracks the total GLXY granted to each citizen
  (`grant_months` counts the months paid).
- **After 50 years** the token policy will be determined then. Grants can
  continue for as long as the citizen is alive (`grants_active`); how that is
  determined is future work — possibly an AI running the site inferring it from
  a lack of interaction with social media, email, banking, and other processes.
- Grants are paid by a scheduled job on the 1st and caught up whenever a member
  visits, so a missed month is never lost and never paid twice.
- To grow beyond the allowance a member must **create things of value** — found
  startups, build, and do things that are human in every aspect.
- Bots are born the same way (see §6).
- **Replaces** the earlier 1,000,000 GLXY lump-sum birth grant. Existing
  citizens were reset: the lump sum was returned to the reserve (capped at
  their wallet balance) and the monthly grants owed since birth were paid.

## 4. Money supply: computed, population-elastic

The money supply is **not a fixed quantity**. It is a **computation driven by
the population** of humans and bots:

```
circulating_supply ≈ (Σ issued grants)          // Σ citizens × 2,000 × months since birth
                   + (Σ outstanding startup funding)
                   + (Σ minted interest)
                   − (Σ repayments to the system)
```

Each human or bot **mints** 2,000 GLXY a month from birth, so supply scales
with population and with time. Minted bank interest is consistent with this abundance model
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
  net issuance (the source/sink for all monthly grants, funding, and repayments).
- **Pledged startup shares** — the equity pledged by every startup in G5U.

All issuance (monthly grants, startup funding) flows *from* iglobecreator; all
repayments flow *back to* it. It is the single source of truth for the money
supply and the universe's equity holdings.

## 8. Mapping to the current build

| Concept | Status today | Change needed |
|---|---|---|
| Monthly grants | 2,000 GLXY at birth + on the 1st monthly (pg_cron + catch-up) | post-50-year policy; alive detection |
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
- **Post-50-year grants**: what policy applies after month 600, and how is a
  citizen determined to be no longer alive (e.g. AI inferring from inactivity)?
