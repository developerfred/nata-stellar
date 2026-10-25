# Environment variables

Source of truth: `apps/web/.env.example` and `packages/mcp/.env.example`. Never commit `.env.local`.

## Web app, public (`NEXT_PUBLIC_*`, inlined into the browser bundle)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC (default `https://soroban-testnet.stellar.org`) |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID` | `campaigns` contract (`C…`) |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | Token SAC (`C…`) |
| `NEXT_PUBLIC_TOKEN_SYMBOL` | Symbol shown in the UI (`vUSD`) |
| `NEXT_PUBLIC_TOKEN_ISSUER` | Issuer `G…`, for the sponsored trustline and faucet |
| `NEXT_PUBLIC_FRIENDBOT_URL` | Friendbot for XLM funding |
| `NEXT_PUBLIC_WALLET_WASM_HASH` | Passkey wallet WASM hash; empty means device wallets |
| `NEXT_PUBLIC_EXPLORER_URL` | Explorer base URL for transaction links |
| `NEXT_PUBLIC_SITE_URL` | Optional. Absolute origin used in `/llms.txt` and `/.well-known/mcp.json`; relative links if unset |

## Web app, server only (never prefix with `NEXT_PUBLIC_`)

| Variable | Description |
|---|---|
| `SPONSOR_SECRET` | Funded testnet account (`S…`) that pays fees when no relayer is set, and signs the fee bump of `/api/trustline` (so it is needed even with a relayer) |
| `RELAYER_URL`, `RELAYER_API_KEY` | Optional OpenZeppelin relayer; both required together. Passkey wallet creation (`/api/wallet`) requires it |
| `RELAYER_TIMEOUT_MS` | Default 12000; then falls back to the sponsor |
| `CONFIRM_BUDGET_MS` | Default 20000; then `/api/claim` returns a pending hash |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limiter (also `KV_REST_API_URL`, `KV_REST_API_TOKEN`) |
| `FAUCET_SECRET` | Must be the secret of `NEXT_PUBLIC_TOKEN_ISSUER`; any other key keeps the faucet off (503). Can mint unlimited vUSD: dedicated testnet key only. On Vercel the faucet also needs the Upstash/KV store |
| `FAUCET_AMOUNT`, `FAUCET_PER_ADDRESS_DAILY`, `FAUCET_PER_IP_DAILY`, `FAUCET_DAILY_BUDGET`, `FAUCET_BUDGET_MS` | Faucet limits. Defaults: 100 vUSD per request, 3 per address and 10 per IP per UTC day, 20000 in total per day, 8000 ms send budget |
| `RELAYER_SOURCE` | Optional placeholder source account used when simulating a claim with a relayer and no `SPONSOR_SECRET` |
| `X402_PAY_TO` | Receiving `G…` account of the paid endpoint. Unset means `/api/x402/campaigns-premium` answers 503 |
| `X402_ASSET` | SEP-41 contract paid in. Default `NEXT_PUBLIC_TOKEN_CONTRACT_ID` |
| `X402_PRICE` | Whole tokens, default `0.01` |
| `X402_NETWORK` | `stellar:testnet` (default) or `stellar:pubnet` |
| `X402_FACILITATOR_URL` | Default `https://www.x402.org/facilitator` (Coinbase, testnet) |
| `X402_FACILITATOR_API_KEY` | Only for the OpenZeppelin facilitator; keep out of git |

Scripts only (not read by the app): `X402_CLIENT_SECRET` (payer secret) and `X402_URL` for `pnpm x402:e2e`, see [X402.md](X402.md).

## MCP server (`packages/mcp`, set in the MCP client config, not in chat)

| Variable | Description |
|---|---|
| `NATA_AGENT_SECRET` | Testnet secret key of the agent account; without it the server is read-only |
| `NATA_CAMPAIGNS_CONTRACT_ID`, `NATA_TOKEN_CONTRACT_ID`, `NATA_TOKEN_SYMBOL` | Contracts and symbol |
| `NATA_RPC_URL`, `NATA_NETWORK_PASSPHRASE` | Optional; non-testnet networks are refused |
| `NATA_FRIENDBOT_URL` | Optional Friendbot override for XLM funding |
| `NATA_MAX_BUDGET_PER_CALL` | Default 100 |
| `NATA_MAX_TOTAL_BUDGET` | Default 500 per session |
| `NATA_DRY_RUN` | `true` makes every write a preview |
| `NATA_FAUCET_URL` | Web app faucet endpoint for `request_faucet`, i.e. `https://<host>/api/faucet` |
