#![cfg(test)]
extern crate std;

use super::*;
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env, String,
};

const REWARD: i128 = 2_0000000;
const BUDGET: i128 = 10_0000000;
const NOW: u64 = 1_793_000_000;

struct Setup<'a> {
    env: Env,
    client: CampaignsClient<'a>,
    token: TokenClient<'a>,
    merchant: Address,
    key: SigningKey,
    id: u64,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = NOW);

    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token = TokenClient::new(&env, &sac.address());
    let merchant = Address::generate(&env);
    StellarAssetClient::new(&env, &sac.address()).mint(&merchant, &BUDGET);

    let contract_id = env.register(Campaigns, ());
    let client = CampaignsClient::new(&env, &contract_id);

    let key = SigningKey::from_bytes(&[7u8; 32]);
    let signer = BytesN::from_array(&env, &key.verifying_key().to_bytes());
    let id = client.create_campaign(
        &merchant,
        &sac.address(),
        &REWARD,
        &BUDGET,
        &3,
        &(NOW - 10),
        &(NOW + 86_400),
        &signer,
        &String::from_str(&env, "https://nata.example/places/cafe-alfama.json"),
    );

    Setup {
        env,
        client,
        token,
        merchant,
        key,
        id,
    }
}

fn err(e: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(e as u32)
}

fn ticket(s: &Setup, nonce_byte: u8, expires_at: u64) -> (BytesN<32>, BytesN<64>) {
    sign_with(s, &s.key, nonce_byte, expires_at)
}

fn sign_with(
    s: &Setup,
    key: &SigningKey,
    nonce_byte: u8,
    expires_at: u64,
) -> (BytesN<32>, BytesN<64>) {
    let nonce = BytesN::from_array(&s.env, &[nonce_byte; 32]);
    let payload = s.client.ticket_payload(&s.id, &nonce, &expires_at);
    let mut buf = std::vec![0u8; payload.len() as usize];
    payload.copy_into_slice(&mut buf);
    let sig = key.sign(&buf).to_bytes();
    (nonce, BytesN::from_array(&s.env, &sig))
}

#[test]
fn create_moves_budget_into_escrow() {
    let s = setup();
    assert_eq!(s.token.balance(&s.merchant), 0);
    assert_eq!(s.token.balance(&s.client.address), BUDGET);
    assert_eq!(s.client.campaign_count(), 1);
    let c = s.client.get_campaign(&s.id);
    assert_eq!(c.remaining, BUDGET);
    assert!(c.active);
}

#[test]
fn valid_ticket_pays_visitor() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let (nonce, sig) = ticket(&s, 1, NOW + 20);

    let paid = s.client.claim(&s.id, &visitor, &nonce, &(NOW + 20), &sig);

    assert_eq!(paid, REWARD);
    assert_eq!(s.token.balance(&visitor), REWARD);
    assert!(s.client.has_claimed(&s.id, &visitor));
    let c = s.client.get_campaign(&s.id);
    assert_eq!(c.claims, 1);
    assert_eq!(c.remaining, BUDGET - REWARD);
}

#[test]
fn expired_ticket_is_rejected() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let (nonce, sig) = ticket(&s, 1, NOW + 20);
    s.env.ledger().with_mut(|l| l.timestamp = NOW + 21);

    let res = s
        .client
        .try_claim(&s.id, &visitor, &nonce, &(NOW + 20), &sig);
    assert_eq!(res, Err(Ok(err(Error::TicketExpired))));
}

#[test]
fn long_lived_ticket_is_rejected() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let exp = NOW + MAX_TICKET_TTL + 1;
    let (nonce, sig) = ticket(&s, 1, exp);

    let res = s.client.try_claim(&s.id, &visitor, &nonce, &exp, &sig);
    assert_eq!(res, Err(Ok(err(Error::TicketTooLong))));
}

#[test]
fn reused_nonce_is_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    let (nonce, sig) = ticket(&s, 1, NOW + 20);
    s.client.claim(&s.id, &alice, &nonce, &(NOW + 20), &sig);

    let res = s.client.try_claim(&s.id, &bob, &nonce, &(NOW + 20), &sig);
    assert_eq!(res, Err(Ok(err(Error::NonceUsed))));
}

#[test]
fn second_visit_by_same_wallet_is_rejected() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let (n1, s1) = ticket(&s, 1, NOW + 20);
    s.client.claim(&s.id, &visitor, &n1, &(NOW + 20), &s1);

    let (n2, s2) = ticket(&s, 2, NOW + 20);
    let res = s.client.try_claim(&s.id, &visitor, &n2, &(NOW + 20), &s2);
    assert_eq!(res, Err(Ok(err(Error::AlreadyClaimed))));
}

#[test]
fn ticket_signed_by_other_key_is_rejected() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let attacker = SigningKey::from_bytes(&[9u8; 32]);
    let (nonce, sig) = sign_with(&s, &attacker, 1, NOW + 20);

    let res = s
        .client
        .try_claim(&s.id, &visitor, &nonce, &(NOW + 20), &sig);
    assert!(res.is_err());
    assert_eq!(s.token.balance(&visitor), 0);
}

#[test]
fn tampered_expiry_is_rejected() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let (nonce, sig) = ticket(&s, 1, NOW + 20);

    let res = s
        .client
        .try_claim(&s.id, &visitor, &nonce, &(NOW + 200), &sig);
    assert!(res.is_err());
}

#[test]
fn max_claims_caps_payouts() {
    let s = setup();
    for i in 0..3u8 {
        let v = Address::generate(&s.env);
        let (n, sig) = ticket(&s, i + 1, NOW + 20);
        s.client.claim(&s.id, &v, &n, &(NOW + 20), &sig);
    }
    let late = Address::generate(&s.env);
    let (n, sig) = ticket(&s, 99, NOW + 20);
    let res = s.client.try_claim(&s.id, &late, &n, &(NOW + 20), &sig);
    assert_eq!(res, Err(Ok(err(Error::BudgetExhausted))));
}

#[test]
fn close_refunds_remaining_and_blocks_claims() {
    let s = setup();
    let visitor = Address::generate(&s.env);
    let (n, sig) = ticket(&s, 1, NOW + 20);
    s.client.claim(&s.id, &visitor, &n, &(NOW + 20), &sig);

    let refund = s.client.close_campaign(&s.id);
    assert_eq!(refund, BUDGET - REWARD);
    assert_eq!(s.token.balance(&s.merchant), BUDGET - REWARD);

    let other = Address::generate(&s.env);
    let (n2, sig2) = ticket(&s, 2, NOW + 20);
    let res = s.client.try_claim(&s.id, &other, &n2, &(NOW + 20), &sig2);
    assert_eq!(res, Err(Ok(err(Error::Inactive))));
}

#[test]
fn invalid_params_are_rejected() {
    let s = setup();
    let signer = BytesN::from_array(&s.env, &s.key.verifying_key().to_bytes());
    let res = s.client.try_create_campaign(
        &s.merchant,
        &s.token.address,
        &REWARD,
        &(REWARD - 1),
        &1,
        &NOW,
        &(NOW + 10),
        &signer,
        &String::from_str(&s.env, ""),
    );
    assert_eq!(res, Err(Ok(err(Error::InvalidParams))));
}

/// Reference vector produced by `apps/web/lib/ticket.vectors.mjs`; keeps the
/// merchant-device encoding and the contract in lockstep.
#[test]
fn ticket_payload_matches_web_encoding() {
    let env = Env::default();
    let contract = Address::from_str(
        &env,
        "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526",
    );
    let id = env.register_at(&contract, Campaigns, ());
    let client = CampaignsClient::new(&env, &id);

    let nonce = BytesN::from_array(&env, &[5u8; 32]);
    let payload = client.ticket_payload(&42, &nonce, &1_793_000_020);

    let mut buf = std::vec![0u8; payload.len() as usize];
    payload.copy_into_slice(&mut buf);
    let hex: std::string::String = buf.iter().map(|b| std::format!("{b:02x}")).collect();
    assert_eq!(
        hex,
        "6e6174612d636c61696d2d763100000012000000010101010101010101010101010101010101010101010101010101010101010101000000000000002a0505050505050505050505050505050505050505050505050505050505050505000000006adf0254"
    );
}
