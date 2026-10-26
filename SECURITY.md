# Security policy

nata is a hackathon project (HackMeridian, Lisbon, Oct 2026). It runs on **Stellar Testnet only**, has had **no external audit**, and must not hold real funds.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting ("Security" tab, "Report a vulnerability") on this repository, or email codingsh@pm.me. Include what you found, how to reproduce it and the affected component (contract, web app, MCP server). We aim to reply within a few days.

## Scope

- `contracts/campaigns` (escrow, ticket verification, nonces, refunds)
- `apps/web` (API routes, faucet, sponsorship, x402 gate)
- `packages/mcp` (agent tools and spend caps)

The threat model and its known limits are in [docs/security.md](docs/security.md).

## Secrets handling

- Only `*.env.example` files are tracked; `.env*` is git-ignored.
- Server-only values (`SPONSOR_SECRET`, `FAUCET_SECRET`, `RELAYER_API_KEY`, `X402_FACILITATOR_API_KEY`, `NATA_AGENT_SECRET`, Upstash tokens) must never use a `NEXT_PUBLIC_` prefix.
- `FAUCET_SECRET` is the vUSD issuer key and can mint without limit. Use a dedicated testnet key.
- A full-history scan (all branches) found no Stellar secret seeds, API keys, `.env` files or deploy tokens as of 2026-10-26. Contract IDs and `G…` addresses in the repo are public identifiers.

## If a secret leaks

1. Treat it as compromised immediately; deleting the commit is not enough.
2. Rotate it: create a new Stellar keypair and move funds, regenerate the relayer / Upstash / Vercel / facilitator keys, and update the Vercel environment variables.
3. For `FAUCET_SECRET` or `SPONSOR_SECRET`, abandon the key: a new issuer means a new vUSD asset, token contract and trustlines (testnet only, so redeploy).
4. Remove it from history (`git filter-repo` or BFG) on every branch, force-push, and ask GitHub support to purge cached views if the repo was public.
5. Re-run a scan (`gitleaks detect --log-opts="--all"`) and record the rotation in the incident notes.
