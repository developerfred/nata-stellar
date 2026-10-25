# nata web

Next.js app for visitors and merchants.

| Route | What it does |
|---|---|
| `/` | Wallet card, live campaigns |
| `/place/[id]` | Menu, promo, reward for one place |
| `/scan` then `/claim` | Scan the counter QR, claim the reward |
| `/merchant` | Counter key, create campaign, visits and spend, close and refund |
| `/merchant/counter?c=ID` | Full-screen QR that rotates every 20 s |
| `/api/claim` | Validates, simulates and submits `claim` (relayer or sponsor), rate limited per IP and wallet |

How it fits together:

- The merchant key (ed25519) is generated in the merchant's browser and signs `(contract, campaign, nonce, expires_at)`. The contract verifies it, so the backend has no power over funds.
- The place profile (name, menu, promo) is stored on-chain in the campaign's `meta_uri` as a `data:` URI. No database.
- Visitors use a passkey smart wallet when `NEXT_PUBLIC_WALLET_WASM_HASH` and a relayer are configured, otherwise a device wallet.

## Run

```
cp .env.example .env.local   # fill in contract IDs
pnpm install
pnpm dev
```

`pnpm build && pnpm lint` must pass before deploying to Vercel.
