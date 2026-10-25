import { DEPLOY_ENV, ENDPOINTS, ENV_VARS, EXAMPLE, FACTS, INSTALL_CMD, SECTIONS, TOOLS, TOOL_DESC, UI } from "./content";

/** Optional absolute origin; links stay relative when unset. Public value, no secrets. */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

const L = "en" as const;

export function llmsTxt(): string {
  return `# nata

> Pay-per-visit campaigns on Stellar Testnet. Places lock a ${FACTS.tokenSymbol} budget in a Soroban contract that pays only when a real visit is proven. An MCP server and a Claude skill let AI agents create and manage campaigns. Testnet only.

## Agent docs

- [Agent guide (full)](${SITE}/llms-full.txt): MCP install, tools, safety limits, examples
- [Agent guide (markdown)](${SITE}/docs/agents.md): same content
- [MCP server config](${SITE}/.well-known/mcp.json): machine-readable install description
- [Docs page (EN/PT/ES)](${SITE}/docs): human-readable version, with faucet, x402, Vercel deploy and known limitations

## API for agents (testnet)

- POST ${SITE}/api/faucet: mint test vUSD to a G or C address (rate limited)
- GET ${SITE}/api/x402/campaigns-premium: paid campaign analytics over x402 (HTTP 402, price 0.01 vUSD, off until configured)
- GET ${SITE}/api/campaigns: free list of campaigns

## Source

- [Repository](${FACTS.repo}): contract, web app, MCP server (packages/mcp), skill (skills/nata)
- [x402 guide](${FACTS.repo}/blob/main/docs/X402.md)
- [MCP and skill docs](${FACTS.repo}/blob/main/docs/mcp-and-skill.md)
- [Architecture](${FACTS.repo}/blob/main/ARCHITECTURE.md)
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
