import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createChainDeps } from "./deps.js";
import { Handlers } from "./handlers.js";
import { buildServer } from "./server.js";

async function main() {
  const cfg = loadConfig();
  const server = buildServer(new Handlers(cfg, await createChainDeps(cfg)));
  await server.connect(new StdioServerTransport());
  console.error(`nata-mcp ready (testnet${cfg.dryRun ? ", dry-run" : ""}${cfg.agentSecret ? "" : ", read-only: no NATA_AGENT_SECRET"})`);
}

main().catch((e) => {
  console.error(`nata-mcp failed to start: ${(e as Error).message}`);
  process.exit(1);
});
