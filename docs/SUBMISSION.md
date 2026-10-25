# HackMeridian submission checklist

Deadline: Mon Oct 26, 12:00 (Lisbon).

## Done in the repository

- [x] README: summary, problem, setup, environment variables, demo instructions
- [x] ARCHITECTURE.md: Stellar usage
- [x] Contract tests cover every case required by the plan (`docs/VERIFICATION.md`)
- [x] Testnet evidence for `create_campaign` and an accepted `claim` (README)
- [x] Refused claims: reused QR, second visit and forged signature are checked by `scripts/e2e-testnet.sh` (rejected at simulation, so no transaction exists)
- [x] Prior work: none, everything built during the event (see commit dates)
- [x] Pitch deck: `docs/nata-pitch-deck-hackmeridian.pptx`
- [x] Vercel deploy notes with the exact env vars: `docs/VERCEL.md`
- [x] Documentation: `docs/`, in-app `/docs` (EN/PT/ES), `/llms.txt`, `/llms-full.txt`, `/docs/agents.md`, `/.well-known/mcp.json`
- [x] x402 paid endpoint and vUSD faucet implemented and documented (`docs/X402.md`)

## Blockers that need the founder

- [ ] Deploy to Vercel (Root Directory `apps/web`, env vars from `.env.example`) and fund the sponsor account
- [ ] Confirm a fresh browser wallet can claim vUSD (trustline, see `docs/VERCEL.md`)
- [ ] Record the 3 min English demo video (`nata-video/` script and storyboard) and add the URL
- [ ] Fill the remaining placeholders: live URL, video URL, demo QR, license, `close_campaign` link
- [ ] Add the Team slide and live URL/QR to the pitch deck
- [ ] Submit, target 11:00

## Later decision

- The repository stays private for now. HackMeridian requires a public repository, so it must be made public before submitting.

## Open placeholders (single list)

| Placeholder | Where it appears |
|---|---|
| Live app URL | README header table and demo instructions; add `NEXT_PUBLIC_SITE_URL` on Vercel |
| Demo video URL | README header table |
| Demo campaign QR image (`docs/demo-qr.png`) | README demo instructions |
| Passkey wallet WASM hash / factory | `NEXT_PUBLIC_WALLET_WASM_HASH`, empty on purpose until deployed |
| x402 paid round trip with a live facilitator | `docs/X402.md`, "Not verified" |

Find them with `grep -rn TODO README.md ARCHITECTURE.md docs/`.
