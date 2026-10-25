# nata

**Pay-per-visit campaigns on Stellar.** Any place (restaurant, café, shop, event booth, museum) locks a USDC budget in a Soroban contract that **pays only when a real visit is proven at the counter**. Visitors get instant cashback in a passkey wallet: no seed phrase, no gas.

> Built during HackMeridian (Lisbon, Oct 25–26, 2026). Track: **Genesis** + **Stellar Composed**. Network: **Stellar Testnet**.

| | |
|---|---|
| Live app | `TODO: https://<deployment>.vercel.app` |
| Demo video | `TODO: <video URL>` |
| Pitch deck | [docs/nata-pitch-deck-hackmeridian.pptx](docs/nata-pitch-deck-hackmeridian.pptx) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Campaigns contract (testnet) | [`CBLE7UFHEZT7YCWABJN5JCH5V7O4BVUWRNCPYZ5HVTUKDGV3OIAVKSXV`](https://stellar.expert/explorer/testnet/contract/CBLE7UFHEZT7YCWABJN5JCH5V7O4BVUWRNCPYZ5HVTUKDGV3OIAVKSXV) |

## The problem

Local marketing pays for impressions and clicks, but nobody can prove that someone actually walked through the door. Loyalty programs are locked inside a single shop, and card cashback takes days and costs fees. Small merchants and event organizers end up paying for reach they cannot measure.

## The solution

1. A **merchant** creates a campaign ("2 USDC per visit, 100 USDC budget"). The budget is escrowed in the `campaigns` Soroban contract.
2. At the counter, the merchant's device shows a **rotating QR code** (new every 20 s) signed with a campaign ed25519 key.
3. A **visitor** opens the PWA, signs in with a passkey (Face ID / Touch ID), scans the QR, and receives the reward in seconds. A relayer sponsors the fees, so the visitor never needs XLM.
4. The contract verifies the signature, expiry, one-time nonce and one-claim-per-wallet rule **on-chain**. The backend has no power over the funds.

The merchant pays per proven visit, not per ad. The visitor gets real dollars that can be spent anywhere in the network.

### Users

- **Merchants:** small local businesses and event organizers.
- **Visitors:** people moving around a city or an event, such as tourists and conference attendees.

## Repository layout

```
contracts/campaigns   Soroban escrow + proof-of-visit contract (Rust)
apps/web              Visitor PWA + merchant dashboard (Next.js)
docs/                 Build plan, pitch deck, submission notes
ARCHITECTURE.md       How Stellar is used: assets, contract IDs, wallet, relayer, RPC
```

## Setup

### Prerequisites

- Rust (stable) with the `wasm32v1-none` target, and the [Stellar CLI](https://developers.stellar.org/docs/tools/cli)
- Node.js 20+ and pnpm 10

### 1. Contract

```bash
cargo test                                   # unit tests (12 cases)
stellar contract build                       # builds target/wasm32v1-none/release/campaigns.wasm

stellar keys generate deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/campaigns.wasm \
  --source deployer --network testnet
# copy the printed C… address into NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID
```

### 2. Web app

```bash
cd apps/web
pnpm install
cp .env.example .env.local     # then fill in the variables below
pnpm dev                       # http://localhost:3000
```

### Environment variables

| Variable | Scope | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_STELLAR_RPC_URL` | client | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | client | Network passphrase | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID` | client | Deployed `campaigns` contract (`C…`) | none, required |
| `NEXT_PUBLIC_EXPLORER_URL` | client | Explorer base URL for transaction links | `https://stellar.expert/explorer/testnet` |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | client | Token (SAC) used for budgets and rewards | none, required |
| `NEXT_PUBLIC_TOKEN_SYMBOL` | client | Token symbol shown in the UI | `USDC` |
| `RELAYER_URL` | server | Fee-sponsoring relayer base URL, for example `https://channels.openzeppelin.com/testnet` | none (optional) |
| `RELAYER_API_KEY` | server | Relayer API key. Never exposed to the browser | none (optional) |
| `SPONSOR_SECRET` | server | Funded testnet account (`S…`) that pays fees when no relayer is configured | none |

> Set either the relayer pair or `SPONSOR_SECRET`. Never commit `.env.local`.

## Demo instructions

### Fastest path for judges (about 1 minute)

1. Open the live app on your phone: `TODO: live URL`.
2. Tap **Create wallet** and confirm with Face ID / Touch ID.
3. Scan the campaign QR below (or on the pitch deck) with the in-app scanner.
4. You receive the reward in a few seconds. Tap the link to see the transaction on stellar.expert.

`TODO: demo campaign QR image (docs/demo-qr.png)`

### Full flow

1. **Merchant:** open `/merchant`, register a place, create a campaign (reward, budget, window), and open **Counter mode** to show the rotating QR.
2. **Visitor:** scan the QR and claim. Balance and history update.
3. **Security checks:** replay an old QR, or claim twice with the same wallet. The contract rejects both (see the refused-claim link below).
4. **Merchant:** check the dashboard for visits, cost per visit and remaining budget, then close the campaign to recover unspent funds.

### Testnet transaction evidence

| Action | Transaction |
|---|---|
| `create_campaign` | [a8746e3a…2fec](https://stellar.expert/explorer/testnet/tx/a8746e3a8524e9a92dc0ab21d0ce11f04d4c5ff48ea7b85a366817fc95322fec) |
| `claim` (accepted, 2 vUSD) | [82f51bda…b46e](https://stellar.expert/explorer/testnet/tx/82f51bda8bd34273881e0eb55c1b0c9316e0232bd8f963a44d76e472e327b46e) |
| `claim` (refused: reused QR, second visit) | No transaction. The server simulates first and returns `This QR code was already used` / `You already collected this reward.` before any fee is spent |
| `close_campaign` (refund, from the e2e script run) | [d658aeb3…a592](https://stellar.expert/explorer/testnet/tx/d658aeb3a14b5971b0574cd33860d3b562cf4aaf028ea06e9f48dd97a12fa592) |

Deployed on Stellar Testnet: token (SAC of `vUSD`) `CBR455EYJZ54MTAOGRKB6M2GCNFLENMVUOPEKXXDWVPODEZLRW7V2PRD`, issuer `GDCSTIPNL2YTPNEYZWFVMSEYOW5SEFC6FFWU2CSIVS67CHCV34YS6B26`, demo campaign id `0` (2 vUSD per visit, 100 vUSD budget, 50 claims max). Contract [deploy tx](https://stellar.expert/explorer/testnet/tx/d6032e522576e42e8c2fdb20a6f35771d9bcb15230f277925b6ff85715404bb3).

## Automated end-to-end check (testnet)

```bash
pnpm --dir apps/web dev &                       # optional: with the app running, claims go through /api/claim
CAMPAIGNS_ID=<C… address> scripts/e2e-testnet.sh   # omit CAMPAIGNS_ID to deploy a fresh contract
```

The script funds throwaway testnet accounts, issues `vUSD`, creates a campaign, signs counter tickets, and checks that a valid claim pays, a reused QR, a second visit and a forged signature are refused, and that `close_campaign` refunds the merchant. It needs `stellar` (CLI 25.2 or newer), `node` and `curl`.

### Fee sponsorship with the OpenZeppelin relayer

By default the server pays fees from `SPONSOR_SECRET`. To use the relayer instead, generate a testnet API key at <https://channels.openzeppelin.com/testnet/gen> and set, in `apps/web/.env.local`:

```
RELAYER_URL=https://channels.openzeppelin.com/testnet
RELAYER_API_KEY=<your key>
```

When both are set, `/api/claim` and `/api/wallet` submit through the relayer and `SPONSOR_SECRET` is not needed. Passkey wallets also need `NEXT_PUBLIC_WALLET_WASM_HASH`. The relayer path has not been exercised yet.

## Security model

| Attack | Mitigation |
|---|---|
| Photo of the QR shared with friends | QR expires in 20–30 s; the nonce is single-use on-chain |
| Same person claiming repeatedly | One claim per wallet per campaign, enforced by the contract |
| Many wallets (sybil) | Relayer rate limits, per-campaign `max_claims`, short ticket TTL. Roadmap: proof of humanity |
| Fake merchant signing visits for themselves | They only spend their own budget, so there is no incentive |
| Malicious backend | Cannot move funds. Rules live in the contract, and rewards can only go to the bound visitor address |

## Out of scope for this MVP

Mainnet, bank cash-out via an anchor, GPS geofencing, strong anti-sybil proofs, and a security audit. These are on the roadmap.

## Prior work disclosure

None. Everything in this repository was built during HackMeridian; see the dated commit history.

## License

[Apache-2.0](LICENSE)
