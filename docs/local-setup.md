# Local setup

## Prerequisites

- Rust stable with the `wasm32v1-none` target, and the [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (25.2 or newer for the e2e script)
- Node.js 20+ and pnpm 10 (the MCP package uses npm)

## Contract

```bash
cargo test                  # 12 unit tests
stellar contract build      # target/wasm32v1-none/release/campaigns.wasm
```

## Web app

```bash
cd apps/web
pnpm install
cp .env.example .env.local   # fill SPONSOR_SECRET at least; see environment.md
pnpm dev                     # http://localhost:3000
pnpm lint && pnpm test && pnpm build
```

`.env.example` already points at the deployed testnet contract and vUSD token. Camera access for the scanner needs HTTPS or `localhost`.

## MCP server

```bash
cd packages/mcp
npm install
npm test
npm run build
```

Then register it with `claude mcp add` as shown in [mcp-and-skill.md](mcp-and-skill.md).
