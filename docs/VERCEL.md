# Deploying to Vercel

Readiness notes only. No app code changes are needed to deploy, but the open risks below should be known before sharing the link.

## Settings

1. Import `developerfred/nata-stellar` into Vercel.
2. Set **Root Directory** to `apps/web` (Next.js is auto-detected, pnpm lockfile is in that folder).
3. Add the variables from `apps/web/.env.example`. The `NEXT_PUBLIC_*` values are public. `SPONSOR_SECRET` (or `RELAYER_URL` + `RELAYER_API_KEY`) are server-only and must never get the `NEXT_PUBLIC_` prefix.
4. Deploy. Vercel serves HTTPS, which the browser camera needs for the QR scanner.

## Known risks

| Risk | Detail | Mitigation |
|---|---|---|
| In-memory rate limit | `lib/server/ratelimit.ts` is per instance, so limits are not shared across serverless instances | Acceptable for the demo (the contract enforces the real rules: nonce, one claim per wallet, `max_claims`). Swap for Vercel KV / Upstash if abused |
| Sponsor balance | `SPONSOR_SECRET` pays fees for every tester | Fund it with plenty of testnet XLM via friendbot before sharing the link |
| Function timeout | `/api/claim` simulates and waits for confirmation, which can approach the 10 s Hobby limit | Retry on the client if it times out; the contract rejects a replayed nonce, so a retry cannot double pay |
| Token trustline | A local `G…` visitor wallet needs a `vUSD` trustline before receiving the SAC reward. A `C…` passkey wallet does not. The web app has no automatic `changeTrust` step | Verify a fresh browser wallet can claim before publishing. If not, add a sponsored trustline step or use a passkey wallet (needs the relayer) |
| Keys in the browser | Visitor and merchant keys live in `localStorage` | Clearing site data loses the account. Testnet only, noted in the README |
| Relayer path | The OpenZeppelin relayer path has not been exercised | Use the `SPONSOR_SECRET` fallback for the demo |

## Smoke test after deploy

1. Open the URL on a phone, create a wallet.
2. Open `/merchant` on a second device, open Counter mode.
3. Scan, claim, confirm the explorer link opens.
4. Scan the same QR again and confirm it is refused.
