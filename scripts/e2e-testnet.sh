#!/usr/bin/env bash
# End-to-end check of nata on Stellar Testnet: deploy, fund a campaign, claim, reject replay and
# second visit, close the campaign. Uses the web API when it is running, otherwise calls the contract.
#
#   scripts/e2e-testnet.sh                  # deploys a fresh contract
#   CAMPAIGNS_ID=C... scripts/e2e-testnet.sh   # reuses a deployed contract
#   BASE_URL=http://localhost:3000 scripts/e2e-testnet.sh   # claim through the web API (and relayer, if configured)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NET=testnet
EXPLORER=https://stellar.expert/explorer/testnet
BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0; FAIL=0

for bin in stellar node curl; do command -v "$bin" >/dev/null || { echo "missing: $bin"; exit 1; }; done

ok()   { echo "  PASS  $*"; PASS=$((PASS + 1)); }
bad()  { echo "  FAIL  $*"; FAIL=$((FAIL + 1)); }
step() { echo; echo "== $*"; }
key()  { stellar keys address "$1" 2>/dev/null || { stellar keys generate "$1" --network $NET --fund >/dev/null 2>&1; stellar keys address "$1"; }; }

step "Accounts"
DEPLOYER=$(key nata-deployer); ISSUER=$(key nata-issuer); MERCHANT=$(key nata-merchant)
RUN=$(date +%s)
stellar keys generate "nata-visitor-$RUN" --network $NET --fund >/dev/null 2>&1
VISITOR=$(stellar keys address "nata-visitor-$RUN")
stellar keys generate "nata-counter-$RUN" >/dev/null 2>&1
COUNTER_PUB=$(stellar strkey decode "$(stellar keys address "nata-counter-$RUN")" | sed -n 's/.*"public_key_ed25519": "\(.*\)".*/\1/p')
SEED=$(stellar strkey decode "$(stellar keys secret "nata-counter-$RUN")" 2>/dev/null | sed -n 's/.*"private_key_ed25519": "\(.*\)".*/\1/p')
echo "  merchant $MERCHANT"; echo "  visitor  $VISITOR"

step "Contract"
if [ -z "${CAMPAIGNS_ID:-}" ]; then
  (cd "$ROOT" && stellar contract build >/dev/null 2>&1) || { echo "build failed (needs stellar-cli >= 25.2)"; exit 1; }
  WASM=$(find "${CARGO_TARGET_DIR:-$ROOT/target}" -path '*wasm32v1-none/release/nata_campaigns.wasm' | head -1)
  CAMPAIGNS_ID=$(stellar contract deploy --wasm "$WASM" --source nata-deployer --network $NET 2>/dev/null | tail -1)
fi
echo "  campaigns $CAMPAIGNS_ID"; ok "contract available"

step "Token (vUSD)"
ASSET="vUSD:$ISSUER"
stellar tx new change-trust --source nata-merchant --line "$ASSET" --network $NET >/dev/null 2>&1 || true
stellar tx new change-trust --source "nata-visitor-$RUN" --line "$ASSET" --network $NET >/dev/null 2>&1
stellar tx new payment --source nata-issuer --destination "$MERCHANT" --asset "$ASSET" --amount 1000000000 --network $NET >/dev/null 2>&1
stellar contract asset deploy --asset "$ASSET" --source nata-issuer --network $NET >/dev/null 2>&1 || true
TOKEN=$(stellar contract id asset --asset "$ASSET" --network $NET)
echo "  token $TOKEN"; ok "token ready"

step "create_campaign (2 vUSD per visit, 100 vUSD budget)"
NOW=$(date +%s)
CREATE=$(stellar contract invoke --id "$CAMPAIGNS_ID" --source nata-merchant --network $NET -- create_campaign \
  --merchant "$MERCHANT" --token "$TOKEN" --reward 20000000 --budget 1000000000 --max_claims 50 \
  --start $((NOW - 600)) --end $((NOW + 604800)) --signer "$COUNTER_PUB" --meta_uri "nata://e2e/$RUN" 2>&1)
CID=$(echo "$CREATE" | tail -1)
echo "$CREATE" | grep -o "$EXPLORER/tx/[0-9a-f]*" | head -1 | sed 's/^/  tx /'
[ "$CID" -ge 0 ] 2>/dev/null && ok "campaign $CID created" || { bad "create_campaign: $CREATE"; exit 1; }

claim() { # $1 = ticket json -> prints response, sets CLAIM_OK
  local body
  body=$(node -e "const t=JSON.parse(process.argv[1]);t.visitor=process.argv[2];console.log(JSON.stringify(t))" "$1" "${CLAIM_AS:-$VISITOR}")
  if curl -sf -m 5 "$BASE_URL" >/dev/null 2>&1; then
    curl -s -m 90 "$BASE_URL/api/claim" -H 'content-type: application/json' -d "$body"
  else
    local c n e s
    c=$(node -pe "JSON.parse(process.argv[1]).c" "$1"); n=$(node -pe "JSON.parse(process.argv[1]).n" "$1")
    e=$(node -pe "JSON.parse(process.argv[1]).e" "$1"); s=$(node -pe "JSON.parse(process.argv[1]).s" "$1")
    stellar contract invoke --id "$CAMPAIGNS_ID" --source "nata-visitor-$RUN" --network $NET -- claim \
      --campaign_id "$c" --visitor "$VISITOR" --nonce "$n" --expires_at "$e" --signature "$s" 2>&1 \
      | sed -n 's/.*\(error\|Error\).*/{"error":"&"}/p;s/.*tx\/\([0-9a-f]*\).*/{"hash":"\1"}/p' | tail -1
  fi
}
ticket() { node "$ROOT/scripts/sign-ticket.mjs" "$CAMPAIGNS_ID" "$CID" "$SEED" "nata-visitor-$RUN" $NET; }

step "Claim with a fresh ticket"
if curl -sf -m 5 "$BASE_URL" >/dev/null 2>&1; then echo "  via web API at $BASE_URL"; else echo "  web app not running: calling the contract directly"; fi
T1=$(ticket); R1=$(claim "$T1" || true); echo "  $R1"
echo "$R1" | grep -q '"hash"' && ok "claim accepted" || bad "claim should have succeeded"

step "Replay the same ticket"
R2=$(claim "$T1" || true); echo "  $R2"
echo "$R2" | grep -q '"error"' && ok "reused QR rejected" || bad "replay should have been rejected"

step "Second visit with a new ticket (same wallet)"
R3=$(claim "$(ticket)" || true); echo "  $R3"
echo "$R3" | grep -q '"error"' && ok "second visit rejected" || bad "second visit should have been rejected"

step "Forged ticket (signed by another key)"
stellar keys generate "nata-visitor2-$RUN" --network $NET --fund >/dev/null 2>&1
stellar tx new change-trust --source "nata-visitor2-$RUN" --line "$ASSET" --network $NET >/dev/null 2>&1
CLAIM_AS=$(stellar keys address "nata-visitor2-$RUN")
FAKE_SEED=$(printf '%064d' 7)
BAD=$(node "$ROOT/scripts/sign-ticket.mjs" "$CAMPAIGNS_ID" "$CID" "$FAKE_SEED" "nata-visitor-$RUN" $NET)
R4=$(claim "$BAD" || true); echo "  $R4"
unset CLAIM_AS
echo "$R4" | grep -q '"error"' && ok "forged ticket rejected" || bad "forged ticket should have been rejected"

step "State"
BAL=$(stellar contract invoke --id "$TOKEN" --source nata-visitor-$RUN --network $NET --send=no -- balance --id "$VISITOR" 2>/dev/null | tr -d '"')
[ "$BAL" = "20000000" ] && ok "visitor balance is 2 vUSD" || bad "visitor balance is $BAL"
stellar contract invoke --id "$CAMPAIGNS_ID" --source nata-merchant --network $NET --send=no -- get_campaign --campaign_id "$CID" 2>/dev/null | tail -1

step "close_campaign (refund to merchant)"
stellar contract invoke --id "$CAMPAIGNS_ID" --source nata-merchant --network $NET -- close_campaign --campaign_id "$CID" 2>&1 | grep -o "$EXPLORER/tx/[0-9a-f]*" | head -1 | sed 's/^/  tx /'
ok "campaign closed"

echo; echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
