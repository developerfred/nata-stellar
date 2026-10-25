# Overview

nata is a pay-per-visit campaign network on **Stellar Testnet**. A place (café, shop, museum, event booth) locks a token budget in a Soroban contract that pays a fixed reward only when a real visit is proven at the counter. Visitors receive the reward in seconds in a passkey or device wallet, with no seed phrase and no XLM for fees.

## Flow

1. A merchant creates a campaign: reward per visit, total budget, time window. The budget moves into contract escrow.
2. The merchant's counter device shows a QR code that rotates every 20 s. Each code is signed with the campaign's ed25519 key.
3. The visitor scans it in the PWA. The server simulates the claim, a sponsor pays the fee, and the contract pays the visitor.
4. The contract checks the signature, expiry, single-use nonce and one-claim-per-wallet rule. The backend cannot redirect funds.
5. The merchant watches visits and remaining budget, and closes the campaign to recover the unspent balance.

AI agents can run steps 1 and 5 through the MCP server (see [mcp-and-skill.md](mcp-and-skill.md)).

## Users

- Merchants: small local businesses and event organizers.
- Visitors: tourists and attendees moving around a city or event.
- Agents: AI assistants that create and manage campaigns for a merchant.

## Repository layout

```
contracts/campaigns   Soroban escrow and proof-of-visit contract (Rust)
apps/web              Visitor PWA, merchant dashboard, vUSD faucet, x402 paid endpoint, API routes, /docs (Next.js)
packages/mcp          MCP server for agents (TypeScript, stdio)
skills/nata           Claude skill that teaches an agent to use the MCP server
scripts/              e2e-testnet.sh and sign-ticket.mjs
docs/                 This documentation
```

## Status

Testnet only. Out of scope: mainnet, anchor cash-out, GPS geofencing, strong anti-sybil proofs, a security audit.
Still to fill by the team: live URL and demo video URL (see [SUBMISSION.md](SUBMISSION.md)).
