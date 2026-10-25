# Architecture

nata is a pay-per-visit campaign network on **Stellar Testnet**. Funds and rules live in a Soroban contract; the web app and backend only carry tickets and sponsor fees.

```
[Visitor PWA] --passkey--> [Smart wallet C…]
     | scans QR (campaign_id, nonce, expires_at, signature)
     v
[Next.js API] --invoke claim--> [Fee sponsor / relayer] --> [Soroban: campaigns] --SAC transfer--> USDC
     ^                                                            |
     |------------------ getEvents (indexer) <--------------------|
[Merchant dashboard] --create_campaign (wallet-signed)--> [campaigns]
[Counter mode] renders a rotating QR signed with a local ed25519 key
```

## Deployed resources (Stellar Testnet)

| Resource | Identifier | Notes |
|---|---|---|
| `campaigns` contract | `TODO: C…` | Escrow + proof-of-visit. Explorer: `TODO` |
| Reward token (SAC) | `TODO: C…` | Circle testnet USDC, or fallback `vUSD` issued by the team |
| `vUSD` issuer (if used) | `TODO: G…` | Only if the Circle faucet is unavailable |
| Fee sponsor / relayer | `TODO` | OpenZeppelin Relayer Channels, or a sponsor account `G…` as fallback |
| Smart wallet factory / WebAuthn verifier | `TODO` | From `passkey-kit` deployment |
| Demo merchant wallet | `TODO: C… or G…` | Funds the demo campaign |
| RPC | `https://soroban-testnet.stellar.org` | Network passphrase `Test SDF Network ; September 2015` |
| Explorer | `https://stellar.expert/explorer/testnet` | |

## Stellar building blocks used

| Block | Role in nata |
|---|---|
| **Soroban smart contract** (`campaigns`) | Budget escrow, ed25519 ticket verification (`env.crypto().ed25519_verify`), single-use nonces, one claim per wallet, events for analytics |
| **Stellar Asset Contract (SAC) / USDC** | Campaign budget and cashback. A `C…` address receives SAC balances without a trustline |
| **Passkey smart wallet** (`passkey-kit`) | Visitors sign in with Face ID / Touch ID. No seed phrase |
| **Fee sponsorship** (OpenZeppelin Relayer Channels) | Visitors never hold XLM. The claim needs no visitor signature, so a plain sponsor account is a safe fallback |
| **Soroban RPC** (`getEvents`, simulate, send) | Transaction submission and the event indexer behind merchant metrics |

Track fit: **Stellar Composed** (passkey wallet + relayer + USDC/SAC + custom contract), idea areas "Stablecoins in everyday life" and "Wallets people want to use".

## `campaigns` contract

Source: [`contracts/campaigns/src/lib.rs`](contracts/campaigns/src/lib.rs). Tests: [`contracts/campaigns/src/test.rs`](contracts/campaigns/src/test.rs).

| Function | Purpose |
|---|---|
| `create_campaign(merchant, token, reward, budget, max_claims, start, end, signer, meta_uri) -> id` | `merchant.require_auth()`, moves `budget` into escrow, stores the campaign, emits `Created` |
| `claim(campaign_id, visitor, nonce, expires_at, signature) -> reward` | Verifies the ticket and pays `reward` to `visitor`, emits `Claimed`. Needs no visitor signature |
| `close_campaign(campaign_id) -> refund` | Merchant recovers the unspent balance, emits `Closed` |
| `get_campaign`, `campaign_count`, `has_claimed`, `ticket_payload` | Read helpers |

### Proof-of-visit ticket

```
message   = "nata-claim-v1" || contract address (ScVal XDR) || campaign_id (u64 BE) || nonce (32 B) || expires_at (u64 BE)
signature = ed25519_sign(campaign signer key, message)
QR        = /claim?c=<campaign_id>&n=<nonce>&e=<expires_at>&s=<signature>
```

The TypeScript encoder in [`apps/web/lib/ticket.ts`](apps/web/lib/ticket.ts) is pinned to the contract by a shared test vector (`ticket_payload_matches_web_encoding`).

### Claim checks (in order)

1. Campaign is active and inside its `start`/`end` window.
2. `expires_at` is not in the past and not more than 300 s ahead (`MAX_TICKET_TTL`).
3. The nonce was not used (temporary storage with TTL).
4. The visitor has not claimed this campaign (persistent storage).
5. `max_claims` and the remaining budget allow another payout.
6. The ed25519 signature matches the campaign `signer`.
7. State is updated, the SAC transfer to `visitor` is made, `Claimed` is emitted.

### Errors

`InvalidParams`, `NotFound`, `Inactive`, `OutsideWindow`, `TicketExpired`, `TicketTooLong`, `NonceUsed`, `AlreadyClaimed`, `BudgetExhausted`.

### Test coverage

Valid claim, expired ticket, over-long ticket, reused nonce, second visit by the same wallet, signature from another key, tampered expiry, `max_claims` cap, close and refund, invalid parameters, escrow accounting, and web/contract encoding parity.

## Web app

`apps/web` is a Next.js (App Router) PWA with the visitor flow and the merchant dashboard at `/merchant`. API routes proxy the relayer (the API key stays server-side), rate-limit claims per IP and wallet, and cache events read from RPC `getEvents` for metrics.

## Trust model

The backend can submit tickets but cannot redirect funds: the reward can only be sent to the `visitor` address bound in the call, and every rule is enforced by the contract. A compromised backend can at worst refuse service.

## Roadmap

Spending the cashback at other merchants (QR charge + passkey payment), multi-stop route bonuses, anchor cash-out, proof-of-humanity for sybil resistance, mainnet and audit.
