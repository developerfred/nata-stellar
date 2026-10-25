import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Handlers, ToolError, schemas } from "./handlers.js";

const DESCRIPTIONS: Record<keyof typeof schemas, string> = {
  list_active_campaigns: "List nata campaigns that are running right now (visitors can claim a reward by visiting the place).",
  get_campaign: "Get one campaign: place details, reward, remaining budget, claims and status.",
  get_claims: "Get claim statistics of a campaign, optionally whether a given wallet already claimed.",
  create_campaign: "Create a nata campaign (activity) funded from the agent account. Locks the budget in escrow on Stellar testnet. Use dry_run first.",
  close_campaign: "Close a campaign created by the agent account and refund the unspent budget.",
  get_agent_account: "Show the agent merchant account: address, token balance and the budget caps for this session.",
  request_faucet: "Fund the agent account with testnet XLM and vUSD so it can create campaigns.",
};

const READ_ONLY = new Set(["list_active_campaigns", "get_campaign", "get_claims", "get_agent_account"]);

export function buildServer(handlers: Handlers): McpServer {
  const server = new McpServer({ name: "nata", version: "0.1.0" });
  for (const name of Object.keys(schemas) as (keyof typeof schemas)[]) {
    server.registerTool(
      name,
      {
        description: DESCRIPTIONS[name],
        inputSchema: schemas[name],
        annotations: { readOnlyHint: READ_ONLY.has(name), openWorldHint: true },
      },
      async (args: unknown) => {
        try {
          const run = handlers[name] as (a: unknown) => Promise<unknown>;
          const out = await run.call(handlers, args);
          return { content: [{ type: "text" as const, text: JSON.stringify(out, null, 2) }] };
        } catch (e) {
          const msg = e instanceof ToolError ? e.message : `Unexpected error: ${(e as Error).message.slice(0, 300)}`;
          return { isError: true, content: [{ type: "text" as const, text: msg }] };
        }
      },
    );
  }
  return server;
}
