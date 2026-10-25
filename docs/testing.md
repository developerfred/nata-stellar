# Testing

| Layer | Command | Covers |
|---|---|---|
| Contract | `cargo test` | 12 cases: valid claim, expiry, over-long ticket, reused nonce, second visit, foreign signature, tampered expiry, `max_claims`, close and refund, invalid params, escrow accounting, web/contract encoding parity |
| Web | `cd apps/web && pnpm lint && pnpm test && pnpm build` | Lint, relayer fallback tests, x402 settings and unpaid-402 tests (offline stub facilitator), production build |
| x402 e2e | `X402_CLIENT_SECRET=S… pnpm x402:e2e` (in `apps/web`) | Live paid round trip against a running app; needs testnet vUSD, see [X402.md](X402.md). Not yet confirmed on chain |
| MCP | `cd packages/mcp && npm test && npm run typecheck && npm run build` | 13 handler tests, types, bundle |
| End to end | `scripts/e2e-testnet.sh` | Live testnet |

## End-to-end script

```bash
pnpm --dir apps/web dev &            # optional: claims then go through /api/claim
CAMPAIGNS_ID=<C… address> scripts/e2e-testnet.sh   # omit to deploy a fresh contract
```

It funds throwaway accounts, issues vUSD, creates a campaign, signs counter tickets, and checks that a valid claim pays while a reused QR, a second visit and a forged signature are refused, and that `close_campaign` refunds the merchant. Needs `stellar` (25.2+), `node`, `curl`. `scripts/sign-ticket.mjs` signs a ticket by hand.

## Refused claims have no transaction

`/api/claim` simulates the claim before submitting (`prepareTransaction`), so a reused QR (`NonceUsed`) or a second visit (`AlreadyClaimed`) fails with `This QR code was already used` / `You already collected this reward.` and no transaction or fee exists. The evidence is the `reused QR rejected`, `second visit rejected` and `forged ticket rejected` PASS lines from `scripts/e2e-testnet.sh` plus the contract tests.
