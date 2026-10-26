# Contributing

Thanks for looking at nata. It is a hackathon MVP on Stellar Testnet, so small, focused changes are easiest to review.

## Setup

See the README for prerequisites. In short:

```bash
cargo test                               # contract tests
cd apps/web && pnpm install && pnpm lint && pnpm test && pnpm build
cd packages/mcp && npm ci && npm run typecheck && npm test
```

CI runs the same checks on every pull request.

## Workflow

1. Fork or branch from `main`; keep a PR to one concern.
2. Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`.
3. Add or update tests for behavior changes. Contract changes need a case in `contracts/campaigns/src/test.rs`.
4. Be honest in docs: say "implemented" only for what has run, and mark testnet-only or unverified parts.
5. Never commit secrets. Only `.env.example` files are tracked. See [SECURITY.md](SECURITY.md).

## Where to start

- Docs index: [docs/README.md](docs/README.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Open gaps: the "Known limitations" section of the README (passkey factory, relayer and x402 verification, multi-token UI).

By contributing you agree your work is licensed under Apache-2.0.
