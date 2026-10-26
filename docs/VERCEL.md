# Deploying to Vercel

Testnet only. No app code changes are needed; read the risks below before sharing the link.

## Settings

1. Import `developerfred/nata-stellar` into Vercel.
2. Set **Root Directory** to `apps/web` (Next.js is auto-detected, the pnpm lockfile is in that folder).
3. Add an Upstash Redis database from the Vercel marketplace. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`, which the app reads as well as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Add the variables below.
5. Deploy. Vercel serves HTTPS, which the browser camera needs for the QR scanner.

## Environment variables

`NEXT_PUBLIC_*` values are inlined into the browser bundle: public values only. Everything else is server only and must never get the prefix. The full reference is [environment.md](environment.md); the ready-to-copy values are in `apps/web/.env.example`.

| Variable | Scope | Needed |
|---|---|---|
| `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID`, `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | public | Required |
| `NEXT_PUBLIC_TOKEN_SYMBOL` (`vUSD`; the code default is `USDC`), `NEXT_PUBLIC_TOKEN_ISSUER` | public | Required for the vUSD demo (symbol, trustline sponsorship, faucet) |
| `NEXT_PUBLIC_STELLAR_RPC_URL`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`, `NEXT_PUBLIC_FRIENDBOT_URL`, `NEXT_PUBLIC_EXPLORER_URL` | public | Optional, testnet defaults |
| `NEXT_PUBLIC_WALLET_WASM_HASH` | public | Leave empty: the passkey wallet factory is not deployed |
| `NEXT_PUBLIC_SITE_URL` | public | Optional, makes links in `/llms.txt` and `/.well-known/mcp.json` absolute |
| `SPONSOR_SECRET` | server | Required. Funded testnet account: pays claim fees (or is the fallback when the relayer fails) and signs the fee bump of `/api/trustline` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL`, `KV_REST_API_TOKEN`) | server | Required for the faucet (it answers 503 on Vercel without them); recommended for claim rate limits |
| `FAUCET_SECRET` | server | For the faucet. **Must be the secret of the vUSD issuer** (`NEXT_PUBLIC_TOKEN_ISSUER`); any other key leaves the faucet off. Testnet-only dedicated key: it can mint unlimited vUSD |
| `FAUCET_AMOUNT`, `FAUCET_PER_ADDRESS_DAILY`, `FAUCET_PER_IP_DAILY`, `FAUCET_DAILY_BUDGET`, `FAUCET_BUDGET_MS` | server | Optional (100, 3, 10, 20000, 8000) |
| `RELAYER_URL`, `RELAYER_API_KEY`, `RELAYER_TIMEOUT_MS` | server | Optional; both URL and key together. Optional; verified live on testnet. Passkey wallets would also need it, but they are not deployed |
| `CONFIRM_BUDGET_MS` | server | Optional, default 20000 |
| `X402_PAY_TO`, `X402_ASSET`, `X402_PRICE`, `X402_NETWORK`, `X402_FACILITATOR_URL`, `X402_FACILITATOR_API_KEY` | server | Optional; the paid route answers 503 until `X402_PAY_TO` is set. See [X402.md](X402.md) |

## Known risks

| Risk | Detail | Mitigation |
|---|---|---|
| Rate limit across instances | `lib/server/ratelimit.ts` uses Upstash Redis / Vercel KV (REST) when configured and falls back to an in-memory window otherwise or if the store is down. The faucet refuses to run on Vercel without the store | Add the Upstash database before sharing the link. The contract still enforces the real rules |
| Sponsor balance | `SPONSOR_SECRET` pays fees for every tester | Fund it with plenty of testnet XLM via friendbot before sharing the link |
| Faucet key | `FAUCET_SECRET` is the vUSD issuer key | Dedicated testnet issuer only, never reused. Rotate by reissuing the token if it leaks |
| Function timeout | `/api/claim` waits at most `CONFIRM_BUDGET_MS` (20 s), then returns 202 with the hash and the client polls `/api/claim/status`. The faucet waits `FAUCET_BUDGET_MS` (8 s). `maxDuration` is 60 s for claim, 30 s for the faucet | A retry cannot double pay (the contract rejects a replayed nonce) |
| Token trustline | A `G…` device wallet needs a vUSD trustline. The app opens it through `/api/trustline`, a sponsored `changeTrust` (needs `SPONSOR_SECRET` and the issuer). A `C…` passkey wallet (not deployed) would need none | Verify on a fresh browser that a new wallet can get vUSD from `/faucet` and claim |
| Keys in the browser | Visitor and merchant keys live in `localStorage` | Clearing site data loses the account. Testnet only |
| Relayer path | `RELAYER_URL` and `RELAYER_API_KEY` are validated together, the relayer gets `RELAYER_TIMEOUT_MS` (12 s), and on error or timeout the claim falls back to `SPONSOR_SECRET`. Unit tested; not run against a live relayer | Set `SPONSOR_SECRET` as well so a relayer outage does not block claims |

## Smoke test after deploy

1. Open the URL on a phone, create a wallet, get vUSD from `/faucet`.
2. Open `/merchant` on a second device, open Counter mode.
3. Scan, claim, confirm the explorer link opens.
4. Scan the same QR again and confirm it is refused.
5. Check `/llms.txt`, `/docs` and `/.well-known/mcp.json` load; with `X402_PAY_TO` set, `curl -i /api/x402/campaigns-premium` returns 402.
