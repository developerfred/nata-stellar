# nata

**Pay-per-visit campaigns on Stellar.** Any place (restaurant, café, shop, event booth, museum) locks a USDC budget in a Soroban contract that **pays only when a real visit is proven at the counter**. Visitors get instant cashback in a passkey wallet: no seed phrase, no gas.

> Built during HackMeridian (Lisbon, Oct 25–26, 2026). Genesis · Stellar Composed. Network: Stellar Testnet.

## Repository layout

```
contracts/campaigns   Soroban escrow + proof-of-visit contract (Rust)
apps/web              Visitor PWA + merchant dashboard (Next.js)
docs/                 Build plan and architecture
```

## Status

Work in progress. See [docs/PLANO.md](docs/PLANO.md) for the build plan.
