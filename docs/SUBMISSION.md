# HackMeridian submission checklist

Deadline: Mon Oct 26, 12:00 (Lisbon).

## Done in the repository

- [x] README: summary, problem, setup, environment variables, demo instructions
- [x] ARCHITECTURE.md: Stellar usage
- [x] Contract tests cover every case required by the plan (`docs/VERIFICATION.md`)
- [x] Testnet evidence for `create_campaign` and an accepted `claim` (README)
- [x] Refused claims: reused QR, second visit and forged signature are checked by `scripts/e2e-testnet.sh` (rejected at simulation, so no transaction exists)
- [x] Prior work: none, everything built during the event (see commit dates)
- [x] Pitch deck: `docs/nata-pitch-deck.pptx`
- [x] Vercel readiness notes: `docs/VERCEL.md`

## Blockers that need the founder

- [ ] Make the GitHub repository public
- [ ] Deploy to Vercel (Root Directory `apps/web`, env vars from `.env.example`) and fund the sponsor account
- [ ] Confirm a fresh browser wallet can claim vUSD (trustline, see `docs/VERCEL.md`)
- [ ] Record the 3 min English demo video (`nata-video/` script and storyboard) and add the URL
- [ ] Fill the remaining placeholders: live URL, video URL, demo QR, license, `close_campaign` link
- [ ] Add the Team slide and live URL/QR to the pitch deck
- [ ] Submit, target 11:00

Remaining placeholders: `grep -rn TODO README.md ARCHITECTURE.md docs/`
