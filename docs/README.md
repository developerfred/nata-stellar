# nata documentation

| Document | What it covers |
|---|---|
| [overview.md](overview.md) | The problem, the product, who uses it, repository layout |
| [architecture.md](architecture.md) | Contract, web app, relayer and sponsor, faucet, passkey wallet, rotating QR, MCP |
| [local-setup.md](local-setup.md) | Prerequisites and running the contract, web app and MCP locally |
| [testnet-deploy.md](testnet-deploy.md) | Building and deploying the contract, issuing the token, funding accounts |
| [environment.md](environment.md) | Every environment variable, public versus server-only |
| [VERCEL.md](VERCEL.md) | Deploying the web app to Vercel: exact env vars, known risks, smoke test |
| [X402.md](X402.md) | The x402 paid endpoint on Stellar: how it works, config, e2e client |
| [security.md](security.md) | Threat model and mitigations |
| [testing.md](testing.md) | Unit tests and the end-to-end testnet script |
| [mcp-and-skill.md](mcp-and-skill.md) | Using the MCP server and the Claude skill |
| [VERIFICATION.md](VERIFICATION.md) | Audit of the build plan against the repository |
| [SUBMISSION.md](SUBMISSION.md) | HackMeridian submission checklist and the one list of open placeholders |
| [PLANO.md](PLANO.md) | Original build plan (Portuguese) |

Also see the root [README.md](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md) (deployed IDs and Stellar building blocks).

The running app serves the agent-facing part of these docs at `/docs` (EN/PT/ES, includes faucet, x402, Vercel deploy and known limitations), `/llms.txt`, `/llms-full.txt`, `/docs/agents.md` and `/.well-known/mcp.json`.

License: [Apache-2.0](../LICENSE), copyright 2026 codingsh.
