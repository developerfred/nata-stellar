# What is new in nata

**Idea:** a merchant's budget sits in a smart contract that releases a reward only when a visit is proven at the counter. The contract decides, not a backend or a card network.

## How it works, in one paragraph

The counter device shows a QR signed with the campaign's ed25519 key and rotating every 20 s. A visitor's claim carries that signed ticket. The Soroban contract verifies the signature, expiry, a single-use nonce and one-claim-per-wallet, then pays from escrow. The backend only submits transactions and sponsors fees; it cannot move funds.

## Comparison

| | Loyalty app / stamp card | Card cashback | Static QR coupon | nata |
|---|---|---|---|---|
| Who proves the visit | Merchant's own system | Card issuer sees a payment, not presence | Nobody (QR can be shared) | Signed rotating QR, checked on-chain |
| Who holds the money | Merchant, promise only | Issuer or network | Merchant, at redemption | Contract escrow, locked up front |
| Reward portability | Stuck in one shop | Statement credit, days later | One use at one shop | A token balance in the visitor's wallet |
| Visitor needs | App and account | A card | Printed or shown code | A browser wallet; fees are sponsored |
| Merchant risk | Fraud, disputes | Fees per transaction | Redeemed by anyone | Spend is capped by the budget and `max_claims` |
| Audit trail | Private | Private | None | Public transactions |

## What is and is not novel

- Proof-of-attendance tokens (POAP-like) already show that signed QR plus on-chain claim works. nata's difference is **payment conditioned on that proof, from a locked budget, with no custodian**, aimed at local merchant acquisition.
- Fee sponsorship, a Stellar Asset Contract token, an MCP server for agents and an x402 paid endpoint are building blocks, not the core idea. They are included because they make campaigns easy to create and consume.

## Limits

A merchant can still sign visits for wallets they control; they only spend their own budget, but they could fake traffic metrics. Sybil visitors are limited by rate limits and `max_claims`, not eliminated. See [security.md](security.md).
