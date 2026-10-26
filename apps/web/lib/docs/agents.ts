import { siteUrl } from "@/lib/site";
import { DEPLOY_ENV, ENDPOINTS, ENV_VARS, EXAMPLE, FACTS, INSTALL_CMD, SECTIONS, TOOLS, TOOL_DESC, UI } from "./content";

/** Absolute origin of the deployment. Public value, no secrets. */
export const SITE = siteUrl();

const L = "en" as const;

export function llmsTxt(): string {
  return `# nata

> nata is a pay-per-visit campaign network on Stellar Testnet. A place locks a ${FACTS.tokenSymbol} test-token budget in a Soroban contract that pays a visitor only when a real visit is proven by scanning a rotating QR code at the counter. An MCP server and a Claude skill let AI agents create and manage campaigns.

nata is a testnet demo: ${FACTS.tokenSymbol} is a team-issued test token with no monetary value, and visitors use a device wallet kept in the browser (passkey wallets are in the code but not deployed). Do not describe it as a production payments service.

## Agent docs

- [Agent guide](${SITE}/llms-full.txt): full guide with MCP install, tools, safety limits and examples
- [Agent guide as markdown](${SITE}/docs/agents.md): the same content served as markdown
- [MCP server config](${SITE}/.well-known/mcp.json): machine-readable install description for the nata MCP server
- [OpenAPI description](${SITE}/openapi.json): the public HTTP endpoints (campaigns, faucet, x402)
- [Docs page](${SITE}/docs): human-readable docs in English, Portuguese and Spanish

## App pages

- [Home](${SITE}/): what nata is and the list of active places
- [Lisbon challenge map](${SITE}/map): animated map of places with active challenges, each pin links to its claim page
- [Scan](${SITE}/scan): scan a counter QR to claim a reward
- [Faucet](${SITE}/faucet): get free test ${FACTS.tokenSymbol}
- [Merchant console](${SITE}/merchant): create and manage a campaign

## HTTP API (testnet)

- [GET /api/campaigns](${SITE}/api/campaigns): free list of campaigns
- POST ${SITE}/api/faucet: mint test ${FACTS.tokenSymbol} to a G or C address (rate limited)
- GET ${SITE}/api/x402/campaigns-premium: paid campaign analytics over x402 (HTTP 402, price 0.01 ${FACTS.tokenSymbol}, off until configured)

## Source

- [Repository](${FACTS.repo}): Soroban contract, web app, MCP server (packages/mcp), skill (skills/nata)
- [Architecture](${FACTS.repo}/blob/main/ARCHITECTURE.md): contracts, accounts and data flow
- [x402 guide](${FACTS.repo}/blob/main/docs/X402.md): pay-per-request on Stellar
- [MCP and skill docs](${FACTS.repo}/blob/main/docs/mcp-and-skill.md): install and use the agent tools

## Optional

- [robots.txt](${SITE}/robots.txt): crawler rules (AI crawlers allowed, /api/ disallowed)
- [sitemap.xml](${SITE}/sitemap.xml): public pages
`;
}

export function agentsGuide(): string {
  const sec = (id: string) => SECTIONS.find((s) => s.id === id)!;
  const text = (id: string) => sec(id).body[L].map((p) => (id === "safety" || id === "limits" ? `- ${p}` : p)).join("\n");
  const tools = TOOLS.map((t) => `| \`${t.id}\` | ${t.inputs} | ${t.write ? "writes" : "read-only"}. ${TOOL_DESC[t.id][L]} |`).join("\n");
  const env = ENV_VARS.map((v) => `| \`${v.name}\` | ${v.note[L]} |`).join("\n");
  return `# nata agent guide

${UI.lead[L]}

Network: ${FACTS.network}. Campaigns contract: \`${FACTS.campaignsContractId}\`. Token (${FACTS.tokenSymbol}) contract: \`${FACTS.tokenContractId}\`.

## ${sec("what").title[L]}

${text("what")}

## ${sec("install").title[L]}

${text("install")}

\`\`\`bash
${INSTALL_CMD}
\`\`\`

Machine-readable config: ${SITE}/.well-known/mcp.json

### Environment (set on the MCP server)

| Variable | Purpose |
|---|---|
${env}

## Tools

| Tool | Inputs | Behavior |
|---|---|---|
${tools}

Amounts are decimal strings (\`"2"\`, \`"1.25"\`), up to 7 decimals. Results are JSON text; errors come back with isError and a plain message.

## Workflow

1. \`get_agent_account\`. If the balance is below the intended budget, \`request_faucet\`.
2. Ask the user only for what is missing: title, location, reward per visit, total budget, days. Defaults: reward 2, budget 50, 7 days.
3. \`create_campaign\` with \`dry_run: true\` and show the preview (max claims = budget / reward).
4. After the user agrees, call it again without \`dry_run\`. Report the campaign id and transaction link.
5. Monitor with \`get_campaign\` / \`get_claims\`. To stop, \`close_campaign\` (dry run first).

The counter device needs the signing key matching \`signer\` to show the rotating QR: by default the agent key, or pass \`signer_public_key\` to use the merchant's counter key from the web app's Counter mode.

## ${sec("safety").title[L]}

${text("safety")}

## ${sec("example").title[L]}

\`\`\`
${EXAMPLE}
\`\`\`

## ${sec("skill").title[L]}

${text("skill")}

## ${sec("faucet").title[L]}

${text("faucet")}

## ${sec("x402").title[L]}

${text("x402")}

Full guide: ${FACTS.repo}/blob/main/docs/X402.md

## ${sec("deploy").title[L]}

${text("deploy")}

\`\`\`bash
${DEPLOY_ENV}
\`\`\`

## ${sec("limits").title[L]}

${text("limits")}

## ${UI.endpoints[L]}

${ENDPOINTS.map((e) => `- ${SITE}${e.path} (${e.kind})`).join("\n")}
`;
}

export function mcpManifest() {
  return {
    $comment: "Description of how to run the nata MCP server. Contains no secrets: fill the placeholders locally.",
    name: "nata",
    description: "Create and manage pay-per-visit campaigns on Stellar Testnet.",
    version: "0.1.0",
    network: FACTS.network,
    license: "Apache-2.0",
    repository: FACTS.repo,
    documentation: `${SITE}/llms-full.txt`,
    install: {
      steps: ["cd packages/mcp", "npm install", "npm run build"],
      claude_code: INSTALL_CMD,
    },
    server: {
      transport: "stdio",
      command: "node",
      args: ["<absolute path to packages/mcp>/dist/index.js"],
      env: {
        NATA_AGENT_SECRET: "<testnet S... secret, kept local>",
        NATA_CAMPAIGNS_CONTRACT_ID: FACTS.campaignsContractId,
        NATA_TOKEN_CONTRACT_ID: FACTS.tokenContractId,
        NATA_TOKEN_SYMBOL: FACTS.tokenSymbol,
      },
    },
    tools: TOOLS.map((t) => ({ name: t.id, inputs: t.inputs, readOnly: !t.write, description: TOOL_DESC[t.id][L] })),
    safety: sec_safety(),
    openapi: `${SITE}/openapi.json`,
    skill: `${FACTS.repo}/tree/main/skills/nata`,
    http_endpoints: {
      faucet: { method: "POST", path: `${SITE}/api/faucet`, body: { address: "G... or C..." }, note: "Mints test vUSD. Set NATA_FAUCET_URL to this URL for request_faucet. A G address needs the vUSD trustline first." },
      x402: { method: "GET", path: `${SITE}/api/x402/campaigns-premium`, note: "HTTP 402 until paid with an x402 v2 client. Returns 503 when the deployment has no X402_PAY_TO.", docs: `${FACTS.repo}/blob/main/docs/X402.md` },
    },
    known_limitations: SECTIONS.find((s) => s.id === "limits")!.body[L],
  };
}

function sec_safety(): string[] {
  return SECTIONS.find((s) => s.id === "safety")!.body[L];
}
