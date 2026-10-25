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
| `SPONSOR_SECRET` | Funded testnet account (`S…`) that pays fees |
| `RELAYER_URL`, `RELAYER_API_KEY` | Optional OpenZeppelin relayer; both required together |
| `RELAYER_TIMEOUT_MS` | Default 12000; then falls back to the sponsor |
| `CONFIRM_BUDGET_MS` | Default 20000; then `/api/claim` returns a pending hash |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limiter (also `KV_REST_API_URL`, `KV_REST_API_TOKEN`) |
| `FAUCET_SECRET` | Token issuer secret. Can mint unlimited vUSD: dedicated testnet key only |
| `FAUCET_AMOUNT`, `FAUCET_PER_ADDRESS_DAILY`, `FAUCET_PER_IP_DAILY`, `FAUCET_DAILY_BUDGET`, `FAUCET_BUDGET_MS` | Faucet limits |

## MCP server (`packages/mcp`, set in the MCP client config, not in chat)

| Variable | Description |
|---|---|
| `NATA_AGENT_SECRET` | Testnet secret key of the agent account; without it the server is read-only |
| `NATA_CAMPAIGNS_CONTRACT_ID`, `NATA_TOKEN_CONTRACT_ID`, `NATA_TOKEN_SYMBOL` | Contracts and symbol |
| `NATA_RPC_URL`, `NATA_NETWORK_PASSPHRASE` | Optional; non-testnet networks are refused |
| `NATA_MAX_BUDGET_PER_CALL` | Default 100 |
| `NATA_MAX_TOTAL_BUDGET` | Default 500 per session |
| `NATA_DRY_RUN` | `true` makes every write a preview |
| `NATA_FAUCET_URL` | Web app faucet endpoint for `request_faucet` |
