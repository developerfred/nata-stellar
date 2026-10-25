//! nata campaigns: pay-per-visit escrow with merchant-signed proof of visit.
//!
//! A merchant locks a token budget in a campaign. At the counter, the merchant
//! device shows a short-lived ticket signed with the campaign's ed25519 key.
//! Anyone can submit that ticket on behalf of a visitor; the reward can only
//! go to the visitor address bound in the claim, so no visitor signature is
//! needed and fees can be sponsored by a relayer.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, token,
    xdr::ToXdr, Address, Bytes, BytesN, Env, String,
};

/// Domain separator prepended to every signed ticket.
const TICKET_DOMAIN: &[u8] = b"nata-claim-v1";
/// A ticket may not be valid for longer than this (seconds).
pub const MAX_TICKET_TTL: u64 = 300;

const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_IN_LEDGERS;
const BUMP_AMOUNT: u32 = 60 * DAY_IN_LEDGERS;
const NONCE_TTL: u32 = DAY_IN_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidParams = 1,
    NotFound = 2,
    Inactive = 3,
    OutsideWindow = 4,
    TicketExpired = 5,
    TicketTooLong = 6,
    NonceUsed = 7,
    AlreadyClaimed = 8,
    BudgetExhausted = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Campaign {
    pub merchant: Address,
    pub token: Address,
    pub reward: i128,
    pub remaining: i128,
    pub claims: u32,
    pub max_claims: u32,
    pub start: u64,
    pub end: u64,
    /// ed25519 public key used by the merchant device to sign tickets.
    pub signer: BytesN<32>,
    /// Off-chain metadata (place, menu, promo), e.g. an https or ipfs URI.
    pub meta_uri: String,
    pub active: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Created {
    #[topic]
    pub campaign_id: u64,
    pub merchant: Address,
    pub reward: i128,
    pub budget: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Claimed {
    #[topic]
    pub campaign_id: u64,
    pub visitor: Address,
    pub reward: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Closed {
    #[topic]
    pub campaign_id: u64,
    pub refund: i128,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    NextId,
    Campaign(u64),
    Claimed(u64, Address),
    Nonce(u64, BytesN<32>),
}

#[contract]
pub struct Campaigns;

#[contractimpl]
impl Campaigns {
    /// Creates a campaign and moves `budget` from the merchant into escrow.
    #[allow(clippy::too_many_arguments)]
    pub fn create_campaign(
        env: Env,
        merchant: Address,
        token: Address,
        reward: i128,
        budget: i128,
        max_claims: u32,
        start: u64,
        end: u64,
        signer: BytesN<32>,
        meta_uri: String,
    ) -> u64 {
        merchant.require_auth();
        if reward <= 0 || budget < reward || max_claims == 0 || end <= start {
            panic_with_error!(&env, Error::InvalidParams);
        }

        token::Client::new(&env, &token).transfer(
            &merchant,
            &env.current_contract_address(),
            &budget,
        );

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        env.storage()
            .instance()
            .extend_ttl(BUMP_THRESHOLD, BUMP_AMOUNT);

        let campaign = Campaign {
            merchant: merchant.clone(),
            token,
            reward,
            remaining: budget,
            claims: 0,
            max_claims,
            start,
            end,
            signer,
            meta_uri,
            active: true,
        };
        save_campaign(&env, id, &campaign);

        Created {
            campaign_id: id,
            merchant,
            reward,
            budget,
        }
        .publish(&env);
        id
    }

    /// Pays `reward` to `visitor` if the merchant-signed ticket is valid.
    pub fn claim(
        env: Env,
        campaign_id: u64,
        visitor: Address,
        nonce: BytesN<32>,
        expires_at: u64,
        signature: BytesN<64>,
    ) -> i128 {
        let mut campaign = load_campaign(&env, campaign_id);
        let now = env.ledger().timestamp();

        if !campaign.active {
            panic_with_error!(&env, Error::Inactive);
        }
        if now < campaign.start || now > campaign.end {
            panic_with_error!(&env, Error::OutsideWindow);
        }
        if expires_at < now {
            panic_with_error!(&env, Error::TicketExpired);
        }
        if expires_at > now + MAX_TICKET_TTL {
            panic_with_error!(&env, Error::TicketTooLong);
        }

        let nonce_key = DataKey::Nonce(campaign_id, nonce.clone());
        if env.storage().temporary().has(&nonce_key) {
            panic_with_error!(&env, Error::NonceUsed);
        }
        let claimed_key = DataKey::Claimed(campaign_id, visitor.clone());
        if env.storage().persistent().has(&claimed_key) {
            panic_with_error!(&env, Error::AlreadyClaimed);
        }
        if campaign.claims >= campaign.max_claims || campaign.remaining < campaign.reward {
            panic_with_error!(&env, Error::BudgetExhausted);
        }

        let message = ticket_message(&env, campaign_id, &nonce, expires_at);
        // Traps the invocation if the signature does not match.
        env.crypto()
            .ed25519_verify(&campaign.signer, &message, &signature);

        env.storage().temporary().set(&nonce_key, &true);
        env.storage()
            .temporary()
            .extend_ttl(&nonce_key, NONCE_TTL, NONCE_TTL);
        env.storage().persistent().set(&claimed_key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&claimed_key, BUMP_THRESHOLD, BUMP_AMOUNT);

        campaign.claims += 1;
        campaign.remaining -= campaign.reward;
        save_campaign(&env, campaign_id, &campaign);

        token::Client::new(&env, &campaign.token).transfer(
            &env.current_contract_address(),
            &visitor,
            &campaign.reward,
        );

        Claimed {
            campaign_id,
            visitor,
            reward: campaign.reward,
        }
        .publish(&env);
        campaign.reward
    }

    /// Closes a campaign and refunds the remaining budget to the merchant.
    pub fn close_campaign(env: Env, campaign_id: u64) -> i128 {
        let mut campaign = load_campaign(&env, campaign_id);
        campaign.merchant.require_auth();
        if !campaign.active {
            panic_with_error!(&env, Error::Inactive);
        }

        let refund = campaign.remaining;
        campaign.remaining = 0;
        campaign.active = false;
        save_campaign(&env, campaign_id, &campaign);

        if refund > 0 {
            token::Client::new(&env, &campaign.token).transfer(
                &env.current_contract_address(),
                &campaign.merchant,
                &refund,
            );
        }

        Closed {
            campaign_id,
            refund,
        }
        .publish(&env);
        refund
    }

    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        load_campaign(&env, campaign_id)
    }

    pub fn campaign_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::NextId).unwrap_or(0)
    }

    pub fn has_claimed(env: Env, campaign_id: u64, visitor: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Claimed(campaign_id, visitor))
    }

    /// The exact bytes a merchant device must sign for a ticket.
    pub fn ticket_payload(env: Env, campaign_id: u64, nonce: BytesN<32>, expires_at: u64) -> Bytes {
        ticket_message(&env, campaign_id, &nonce, expires_at)
    }
}

/// `domain || contract address (ScVal XDR) || campaign_id (u64 BE) || nonce || expires_at (u64 BE)`
fn ticket_message(env: &Env, campaign_id: u64, nonce: &BytesN<32>, expires_at: u64) -> Bytes {
    let mut msg = Bytes::from_slice(env, TICKET_DOMAIN);
    msg.append(&env.current_contract_address().to_xdr(env));
    msg.extend_from_array(&campaign_id.to_be_bytes());
    msg.append(&Bytes::from(nonce.clone()));
    msg.extend_from_array(&expires_at.to_be_bytes());
    msg
}

fn load_campaign(env: &Env, id: u64) -> Campaign {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(id))
        .unwrap_or_else(|| panic_with_error!(env, Error::NotFound))
}

fn save_campaign(env: &Env, id: u64, campaign: &Campaign) {
    let key = DataKey::Campaign(id);
    env.storage().persistent().set(&key, campaign);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_AMOUNT);
}

#[cfg(test)]
mod test;
