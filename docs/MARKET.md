# Market and ecosystem

This page is a plan, not a measurement. nata has **no pilot merchants and no user research yet**. No market statistics are quoted here; every number below is an **assumption** you can replace.

## Target users

| Segment | Who | Why they care |
|---|---|---|
| Local merchants (first) | Cafes, restaurants, small shops in Lisbon neighborhoods with tourist and local foot traffic | They pay for flyers, social ads or platform listings and cannot tell which of them brought a person in the door |
| Event organizers | Conference, expo and market organizers with sponsor booths | Sponsors want proof of booth visits, not badge-scan estimates |
| Visitors | Tourists and locals moving around a city or event | Instant, small rewards that need no app account, seed phrase or XLM |
| Developers and agents | Builders who want to automate campaigns | An open contract, an MCP server and a paid API make campaigns scriptable |

## The problem, sized with explicit assumptions

Spend a merchant can redirect = (merchants in the target area) x (monthly local marketing spend per merchant) x (share that could be pay-per-visit).

| Input | Value | Status |
|---|---|---|
| Merchants in a first neighborhood | 100 | **Assumption**: a plausible count for a dense Lisbon area, to be replaced by a real count |
| Monthly local marketing spend per merchant | 100 EUR | **Assumption**: needs merchant interviews |
| Share movable to pay-per-visit | 10% | **Assumption** |
| Result | about 1,000 EUR per month per neighborhood | Derived from the three assumptions above |

nata's revenue model is a 5 to 10% fee on campaign budget (also an assumption, not tested). At the numbers above one neighborhood is a small business, which is why the plan starts with events and a single neighborhood and treats the number as a hypothesis to test, not a market claim.

## Go-to-market

1. **Pilot, 3 to 5 merchants** in one walkable area, each running a small campaign (for example 20 EUR equivalent in test rewards on testnet first). Success measure: cost per verified visit and repeat visits.
2. **Events**: one organizer, one sponsor booth, a QR at the booth. Success measure: claims per hour and sponsor willingness to pay.
3. **Neighborhood by neighborhood**, using the first merchants' visit data as the sales material.
4. **Mainnet and a real stablecoin** only after a security review and an on-ramp/off-ramp partner. Not in this MVP.

None of these steps has started; the MVP exists to make step 1 possible.

## How nata brings users and transactions to Stellar

- Every proven visit is a Soroban contract call plus a token transfer, so activity scales with foot traffic, not with crypto-native users.
- Visitors get a Stellar account and a stablecoin balance without knowing it: fees are sponsored, so onboarding costs them no XLM.
- Merchants lock budgets as Stellar assets; a campaign is an on-chain escrow with a public audit trail on the explorer.
- The contract accepts any SEP-41 token per campaign, so the same flow can run on USDC or EURC once tested (today the demo uses the team-issued vUSD).

## How others can build on it

- **Open contract**: `contracts/campaigns` is Apache-2.0; anyone can deploy it or read its tickets format (see [ARCHITECTURE.md](../ARCHITECTURE.md)).
- **MCP server and skill**: an AI agent can list, create and close testnet campaigns ([mcp-and-skill.md](mcp-and-skill.md)).
- **x402 endpoint**: premium campaign data behind a paid HTTP call; the paid round trip is verified on testnet ([X402.md](X402.md)).
- **Agent docs**: `/llms.txt` and `/.well-known/mcp.json` describe the app to other tools.

## What we do not know yet

Whether merchants will pay per proven visit, how many fake-visit attempts there will be (anti-sybil is on the roadmap), and what a verified visit is worth to each segment. The pilot exists to answer these.
