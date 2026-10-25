# MCP server and skill

The MCP server in `packages/mcp` lets an agent create, inspect and close nata campaigns on testnet. The in-app guide at `/docs` (and `/docs/agents.md`, `/llms-full.txt`) carries the same information for agents that browse the site.

## Install

```bash
cd packages/mcp && npm install && npm run build

claude mcp add nata \
  -e NATA_AGENT_SECRET=<testnet S... secret of the agent account> \
  -e NATA_CAMPAIGNS_CONTRACT_ID=CBLE7UFHEZT7YCWABJN5JCH5V7O4BVUWRNCPYZ5HVTUKDGV3OIAVKSXV \
  -e NATA_TOKEN_CONTRACT_ID=CBR455EYJZ54MTAOGRKB6M2GCNFLENMVUOPEKXXDWVPODEZLRW7V2PRD \
  -e NATA_TOKEN_SYMBOL=vUSD \
  -- node "$(pwd)/dist/index.js"
```

## Tools

| Tool | Inputs | Output |
|---|---|---|
| `get_agent_account` | none | agent address, token balance, budget caps |
| `request_faucet` | `fund_xlm` (default true) | XLM via Friendbot, then vUSD from the web app faucet (`NATA_FAUCET_URL`). The vUSD part is reported as unavailable if the URL is unset or the account has no vUSD trustline yet (the faucet answers 422) |
| `list_active_campaigns` | `limit` 1 to 100, default 20 | running campaigns, newest first |
| `get_campaign` | `campaign_id` | place, reward, remaining, claims, status |
| `get_claims` | `campaign_id`, optional `visitor` | claim stats, whether the wallet claimed |
| `create_campaign` | `title`, `location`, `reward`, `budget`, optional `kind`, `description`, `promo`, `days` (1 to 90, default 7), `signer_public_key`, `dry_run` | preview or campaign id and transaction link |
| `close_campaign` | `campaign_id`, optional `dry_run` | refund and transaction link |

Amounts are decimal strings (`"2"`, `"1.25"`) up to 7 decimals. Status values: `running`, `scheduled`, `expired`, `exhausted`, `closed`.

## x402

The MCP server does not pay for x402 content. The paid endpoint `/api/x402/campaigns-premium` is called with any x402 v2 client; see [X402.md](X402.md).

## Safety

Testnet only; keys come from the environment and are never logged; budgets capped per call (100) and per session (500); `dry_run` previews any write; only campaigns created by the agent account can be closed; without `NATA_AGENT_SECRET` the server is read-only.

## Skill

`skills/nata/SKILL.md` and `reference.md` teach an agent the workflow (check account, dry run, confirm, create, monitor, close). Copy the folder to `~/.claude/skills/nata` or `.claude/skills/nata`.
