---
name: nata
description: Create and manage nata campaigns (pay-per-visit activities on Stellar testnet) through the nata MCP server. Use when asked to launch, check, or close an activity, promo, or reward for visitors of a place.
---

# nata campaigns

nata lets a place lock a token budget (vUSD) in a Soroban contract that pays a fixed reward to each visitor who proves a real visit by scanning the counter QR. An "activity" here is a nata **campaign**. This skill drives the `nata` MCP server (`packages/mcp`). Testnet only.

## When to use

- The user wants to launch, list, inspect, or close a campaign, promo, or visit reward.
- The user asks how a campaign is doing (claims, budget left, whether a wallet already claimed).

Do not use it for mainnet, real money, or for claiming rewards (visitors claim in the web app).

## Tools

| Tool | Use |
|---|---|
| `get_agent_account` | Agent address, token balance, budget caps for this session. Call first. |
| `request_faucet` | Fund the agent with testnet XLM and vUSD when the balance is low. |
| `list_active_campaigns` | Campaigns running now, newest first. |
| `get_campaign` | One campaign by id: place, reward, remaining, status. |
| `get_claims` | Claims, payout so far, optional check for a visitor wallet. |
| `create_campaign` | Lock a budget and create a campaign. Supports `dry_run`. |
| `close_campaign` | Close an agent-owned campaign and refund the unspent budget. |

## Workflow: create an activity

1. `get_agent_account`. If the balance is below the intended budget, `request_faucet`.
2. Collect from the user: title, location, reward per visit, total budget, duration in days. Ask only for what is missing. Sensible defaults: 2 reward, 50 budget, 7 days.
3. `create_campaign` with `dry_run: true`. Show the user the preview (max claims = budget / reward, end date, who funds it).
4. After the user agrees, call `create_campaign` again without `dry_run`.
5. Report the campaign id and the transaction link. Tell the user the counter device needs the signing key matching `signer` to show the QR (by default the agent key; pass `signer_public_key` to use the merchant's counter key from the web app's Counter mode).

## Workflow: monitor and close

1. `get_campaign` or `get_claims` for status.
2. To stop: `close_campaign` with `dry_run: true` to show the refund, then confirm, then close. Only campaigns created by the agent account can be closed.

## Rules

- Never ask for, print, or store a secret key. Keys come from the server environment only.
- Always dry-run before spending, and get the user's confirmation for each real `create_campaign` or `close_campaign`.
- Respect the caps: a budget over the per-call or session limit is rejected. Do not split a budget into many calls to get around a cap.
- Amounts are decimal strings (`"2"`, `"1.25"`), up to 7 decimals.
- Errors are meant to be read: relay them plainly and fix the input rather than retrying blindly.

## Example

User: "Launch a coffee promo at Cafe Nata, 1.5 vUSD per visit, 30 total, for 3 days."

1. `get_agent_account` -> balance 200 vUSD, ok.
2. `create_campaign` `{title: "Cafe Nata", location: "Rua Augusta 10, Lisboa", kind: "Cafe", promo: "Free coffee visit reward", reward: "1.5", budget: "30", days: 3, dry_run: true}` -> would allow 20 visits.
3. User confirms -> same call with `dry_run: false` -> campaign id `4`, transaction link.
4. Later: `get_claims {campaign_id: "4"}` -> 7 claims, 10.5 paid out. `close_campaign {campaign_id: "4"}` -> refunds 19.5.

More detail: [reference.md](reference.md).
