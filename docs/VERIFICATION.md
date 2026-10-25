# Verification against PLANO.md

Status of every item in `docs/PLANO.md`, checked against this repository.

## Contract (`contracts/campaigns`)

`cargo test` runs 12 passing tests. Coverage of the plan's required cases:

| Required test | Test |
|---|---|
| Valid claim | `valid_ticket_pays_visitor` |
| Expired QR | `expired_ticket_is_rejected`, `long_lived_ticket_is_rejected` |
| Repeated nonce | `reused_nonce_is_rejected` |
| Second visit, same wallet | `second_visit_by_same_wallet_is_rejected` |
| Budget exhausted | `max_claims_caps_payouts` |
| Signature from another key | `ticket_signed_by_other_key_is_rejected` |
| Extra | tampered expiry, close/refund, invalid params, escrow, web/contract payload parity |

## Scope items

| Item | State |
|---|---|
| `create_campaign`, `claim`, `close_campaign`, `get_campaign`, `list_active` | Done, deployed to testnet |
| Visitor app: scan, claim, balance, places | Done (`apps/web`) |
| Merchant panel, counter mode with 20 s rotating QR | Done (`/merchant`, `CounterQr`) |
| Thin backend: sponsor/relayer submit, rate limit by IP and wallet | Done. Rate limit is shared via Upstash / Vercel KV when configured, in-memory fallback otherwise (see `VERCEL.md`) |
| Event indexer / metrics | Read from chain by the merchant panel |
| Seed places (P1) | 8 demo places in Lisbon and the expo, shown only when no live campaign exists |
| Pay at counter, route campaign (P1) | Not done, roadmap |
| Passkey wallet | Code present, depends on relayer and `NEXT_PUBLIC_WALLET_WASM_HASH`. Cut rule applies: local key is the demo path |
| OpenZeppelin relayer | Validated, time-boxed and falls back to `SPONSOR_SECRET` (unit tested with `pnpm test` in `apps/web`). Not yet run against a live relayer |
| Automated e2e | `scripts/e2e-testnet.sh` (9 checks: valid claim, replay, second visit, forged signature, close refund) |

## Serverless hardening

- `/api/claim` returns a pending hash after 20 s and the client polls `/api/claim/status`, so Vercel limits are not hit.
- Still open: vUSD trustline and i18n/onboarding (other threads), keys in `localStorage` (testnet only).

## Submission checklist

See `docs/SUBMISSION.md`.
