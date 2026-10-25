# Security model

| Attack | Mitigation |
|---|---|
| Photo of the QR shared with friends | QR expires in 20 to 30 s; the nonce is single-use on-chain |
| Same person claiming repeatedly | One claim per wallet per campaign, enforced by the contract |
| Many wallets (sybil) | Rate limits, per-campaign `max_claims`, short ticket TTL. Roadmap: proof of humanity |
| Fake merchant signing visits for themselves | They only spend their own budget |
| Malicious backend | Cannot move funds; rewards only go to the visitor address bound in the call |
| Sponsor abuse | Only claim and trustline shapes are sponsored; per-IP and per-wallet rate limits |
| Faucet abuse | Per address, IP and day limits, daily total cap, issuer-key check |
| Runaway agent | MCP caps per call and per session, `dry_run`, own campaigns only, testnet only |
| Secret leakage | Secrets are server-only env vars; the docs routes serve static text with no secrets |

Known limits: keys of device wallets live in `localStorage` (clearing site data loses the account), the in-memory rate limiter is a soft limit without Upstash, and the relayer path is untested against a live relayer. No external audit; testnet only.
