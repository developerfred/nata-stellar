# Testnet deploy

Everything here is Stellar Testnet. Never reuse these keys elsewhere.

1. Build: `stellar contract build`.
2. Fund a deployer: `stellar keys generate deployer --network testnet --fund`.
3. Deploy: `stellar contract deploy --wasm target/wasm32v1-none/release/campaigns.wasm --source deployer --network testnet`. The printed `C…` goes into `NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID`.
4. Token: issue a classic asset (`vUSD`) from a dedicated issuer, wrap it as a Stellar Asset Contract (`stellar contract asset deploy`), and set `NEXT_PUBLIC_TOKEN_CONTRACT_ID`, `NEXT_PUBLIC_TOKEN_SYMBOL` and `NEXT_PUBLIC_TOKEN_ISSUER`. The issuer secret becomes `FAUCET_SECRET` (server only): the faucet only runs when this key matches `NEXT_PUBLIC_TOKEN_ISSUER`.
5. Sponsor: create a funded account (`friendbot`) and set its secret as `SPONSOR_SECRET`. Keep it topped up; it pays every visitor's fees.
6. Optional relayer: generate a key at <https://channels.openzeppelin.com/testnet/gen> and set `RELAYER_URL`, `RELAYER_API_KEY`.
7. Optional x402: set `X402_PAY_TO` to an account with a vUSD trustline (see [X402.md](X402.md)).
8. Verify with `scripts/e2e-testnet.sh` (see [testing.md](testing.md)).

Current deployment: see [ARCHITECTURE.md](../ARCHITECTURE.md).
