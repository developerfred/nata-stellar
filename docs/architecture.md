# Architecture

Deployed IDs live in the root [ARCHITECTURE.md](../ARCHITECTURE.md). This page explains how the parts fit together.

```
Visitor PWA --scan--> Next.js API (/api/claim) --simulate--> Soroban RPC
                          | submit (relayer, else sponsor account)
                          v
                  campaigns contract --SAC transfer--> visitor
Merchant dashboard / Counter mode (rotating QR)      MCP server --> same contract
```

## Contract (`contracts/campaigns`)

Functions: `create_campaign`, `claim`, `close_campaign`, plus reads `get_campaign`, `campaign_count`, `has_claimed`, `ticket_payload`. The ticket message is `"nata-claim-v1" || contract || campaign_id || nonce || expires_at`, signed with ed25519. The contract enforces the active window, a 300 s maximum ticket lifetime, single-use nonces, one claim per wallet, `max_claims`, the remaining budget and the signature. See ARCHITECTURE.md for the ordered checks and errors.

## Web app (`apps/web`)

Next.js App Router PWA, translated into English, Portuguese and Spanish (language from the browser, switcher in the header). Routes: `/` places, `/scan`, `/claim`, `/place/[id]`, `/merchant`, `/faucet`, `/docs`. API routes: `/api/campaigns`, `/api/claim` (+ `/status`), `/api/balance`, `/api/trustline`, `/api/wallet`, `/api/faucet`, `/api/x402/campaigns-premium`. `lib/chain.ts` is the contract client (also reused by the MCP server), `lib/ticket.ts` encodes tickets and is pinned to the contract by a shared test vector.

## Relayer and sponsor

Visitors hold no XLM. `/api/claim` validates the ticket, simulates first (reused QR and second visits are refused before any fee is spent), then submits. If `RELAYER_URL` and `RELAYER_API_KEY` are set, the OpenZeppelin relayer is used with a timeout (`RELAYER_TIMEOUT_MS`); on error it falls back to the account in `SPONSOR_SECRET`. The route waits up to `CONFIRM_BUDGET_MS` and otherwise returns 202 with the hash; the client polls `/api/claim/status`. Claims are rate limited per IP and per wallet (shared through Upstash Redis or Vercel KV when configured).

## Faucet

`/faucet` and `/api/faucet` mint test vUSD (`FAUCET_AMOUNT`, default 100) from the token issuer key in server-only `FAUCET_SECRET`. It refuses any key that is not the token issuer (so it is off, 503, if `FAUCET_SECRET` is another account), limits per address, IP and UTC day, caps the daily total, and refuses to run on Vercel without the shared store. A `G…` address needs a trustline first (422 otherwise); a `C…` address receives through the token contract. The faucet, trustline sponsorship and the MCP `request_faucet` are vUSD-specific (they rely on `NEXT_PUBLIC_TOKEN_ISSUER`); the contract itself takes any SEP-41 token per campaign. `/api/trustline` sponsors the `changeTrust` that lets a device wallet hold vUSD; only that exact transaction shape is sponsored.

## x402 paid endpoint

`GET /api/x402/campaigns-premium` is wrapped with `@x402/next` (`lib/server/x402-gate.ts`). Unpaid calls get `402` with the requirements; a payment is verified by the facilitator before the handler runs and settled only if the handler answers 2xx. Settings come from `X402_*` (`lib/server/x402.ts`); with no `X402_PAY_TO` it answers 503, and it fails closed when the facilitator is down. Details and the e2e client: [X402.md](X402.md).

## Passkey wallet

The code can create a `passkey-kit` smart wallet (`C…` address, Face ID or Touch ID) when `NEXT_PUBLIC_WALLET_WASM_HASH` is set and the relayer is configured. The factory and WebAuthn verifier are not deployed, so this is off and has not been run. The app uses a device wallet: a local key in `localStorage`. A `C…` address receives SAC balances without a trustline.

## Rotating QR

Counter mode keeps a local ed25519 key for the campaign (its public key is the contract's `signer`). Every 20 s it signs a fresh ticket (nonce, `expires_at`) and renders `/claim?c=<id>&n=<nonce>&e=<expires_at>&s=<signature>` as a QR. A photographed QR is useless after it expires or is used.

## MCP server (`packages/mcp`)

A stdio MCP server using the official SDK. It reuses `apps/web/lib` for contract calls and place metadata, signs with the agent key from `NATA_AGENT_SECRET`, enforces budget caps and dry-run. See [mcp-and-skill.md](mcp-and-skill.md).

## Agent-facing docs in the web app

Static routes, no runtime state: `/docs` (HTML, EN/PT/ES; also covers the faucet, x402, Vercel deploy and known limitations), `/llms.txt`, `/llms-full.txt`, `/docs/agents.md`, `/.well-known/mcp.json`, `/robots.txt` and `/sitemap.xml` (the last two from `app/robots.ts` and `app/sitemap.ts`); the docs routes are generated from `apps/web/lib/docs/`.
