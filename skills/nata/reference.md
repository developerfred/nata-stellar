# nata MCP reference

## Environment (set on the MCP server, never in chat)

| Variable | Purpose |
|---|---|
| `NATA_AGENT_SECRET` | Testnet secret key of the agent merchant account. Required for write tools |
| `NATA_CAMPAIGNS_CONTRACT_ID` / `NATA_TOKEN_CONTRACT_ID` | Contracts to use. Required |
| `NATA_MAX_BUDGET_PER_CALL` | Cap for one `create_campaign` (default 100) |
| `NATA_MAX_TOTAL_BUDGET` | Cap for all budgets committed in one server session (default 500). Closing a campaign frees its refund |
| `NATA_DRY_RUN` | `true` makes every write a preview |
| `NATA_FAUCET_URL` | Web app vUSD faucet endpoint, used by `request_faucet` |

## Tool inputs

- `create_campaign`: `title`, `location`, `reward`, `budget`, optional `kind`, `description`, `promo`, `days` (1-90, default 7), `signer_public_key`, `dry_run`.
- `close_campaign`: `campaign_id`, optional `dry_run`.
- `get_campaign`: `campaign_id`. `get_claims`: `campaign_id`, optional `visitor`.
- `list_active_campaigns`: optional `limit`.
- `request_faucet`: optional `fund_xlm` (default true).

## Campaign status

`running`, `scheduled` (before start), `expired` (past end), `exhausted` (budget or claims used up), `closed`.

## Common errors

- "No agent account": the server has no `NATA_AGENT_SECRET`; only read tools work.
- "exceeds the per-call cap" / "session total cap": lower the budget or ask the user to raise the limit in the server env.
- "Agent balance is ...": call `request_faucet`.
- "belongs to another merchant": the agent can only close its own campaigns.
