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
| Passkey wallet | Code path present, **not deployed or enabled**: the factory and WebAuthn verifier do not exist on testnet and `NEXT_PUBLIC_WALLET_WASM_HASH` is empty. Cut rule applied: the device wallet (key in `localStorage`) is the only wallet visitors use |
| OpenZeppelin relayer | Verified live on testnet: 9/9 checks. Claim tx [9f181f3f…b368f3](https://stellar.expert/explorer/testnet/tx/9f181f3f8d17b936ddb2404628c72f3a958b8fcc19ffcc95649b6c8fafb368f3), `close_campaign` tx [51fec925…179514](https://stellar.expert/explorer/testnet/tx/51fec925d7e43d008077c41f0f92f59369f4d44a1528e91f1ab1a8c8c3179514). Falls back to `SPONSOR_SECRET` on error (unit tested with `pnpm test` in `apps/web`) |
| x402 paid endpoint | Verified live on testnet: paid 0.01 vUSD, settled tx [aabd9305…bc9b0be](https://stellar.expert/explorer/testnet/tx/aabd9305ba044c092ac2b799d2e18c875b00742be6b4fd6ba6e87f447bc9b0be). See `docs/X402.md` |
| Automated e2e | `scripts/e2e-testnet.sh` (9 checks: valid claim, replay, second visit, forged signature, close refund). Refused claims (reused QR, second visit, forged signature) are rejected at simulation, so **no transaction exists** for them; the evidence is the PASS lines and the contract tests |

## Serverless hardening

- `/api/claim` returns a pending hash after 20 s and the client polls `/api/claim/status`, so Vercel limits are not hit.
- Done since: vUSD trustline (`/api/trustline`, sponsored), i18n (EN/PT/ES) and the `/faucet` page. Still open: keys in `localStorage` (testnet only).

## Submission checklist

See `docs/SUBMISSION.md`.
