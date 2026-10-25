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
| Rate limit across instances | **Fixed.** `lib/server/ratelimit.ts` uses Upstash Redis / Vercel KV (REST) when `UPSTASH_REDIS_REST_URL`+`_TOKEN` or `KV_REST_API_URL`+`_TOKEN` are set, and falls back to an in-memory window otherwise or if the store is down | Add a free Upstash database from the Vercel marketplace before sharing the link. The contract still enforces the real rules |
| Sponsor balance | `SPONSOR_SECRET` pays fees for every tester | Fund it with plenty of testnet XLM via friendbot before sharing the link |
| Function timeout | **Fixed.** `/api/claim` waits at most `CONFIRM_BUDGET_MS` (20 s), then returns 202 with the hash and the client polls `/api/claim/status`. `maxDuration` is 60 s | None needed. A retry cannot double pay (the contract rejects a replayed nonce) |
| Token trustline | A local `G…` visitor wallet needs a `vUSD` trustline before receiving the SAC reward. A `C…` passkey wallet does not. The web app has no automatic `changeTrust` step | Verify a fresh browser wallet can claim before publishing. If not, add a sponsored trustline step or use a passkey wallet (needs the relayer) |
| Keys in the browser | Visitor and merchant keys live in `localStorage` | Clearing site data loses the account. Testnet only, noted in the README |
| Relayer path | **Hardened.** `RELAYER_URL` and `RELAYER_API_KEY` are validated together, the relayer gets `RELAYER_TIMEOUT_MS` (12 s), and on error or timeout the claim falls back to `SPONSOR_SECRET`. Covered by `pnpm test`. Not yet exercised against a live relayer | Set both `SPONSOR_SECRET` and the relayer vars so a relayer outage does not block claims |

## Smoke test after deploy

1. Open the URL on a phone, create a wallet.
2. Open `/merchant` on a second device, open Counter mode.
3. Scan, claim, confirm the explorer link opens.
4. Scan the same QR again and confirm it is refused.
