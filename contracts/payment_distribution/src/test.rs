#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Env, String,
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    let admin_client = token::StellarAssetClient::new(env, &address);
    let client = token::Client::new(env, &address);
    (address, admin_client, client)
}

fn stakeholder(env: &Env, addr: &Address, role: &str, bps: u32) -> Stakeholder {
    Stakeholder {
        address: addr.clone(),
        role: String::from_str(env, role),
        share_bps: bps,
    }
}

#[test]
fn full_lifecycle_atomic_split() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let farmer = Address::generate(&env);
    let cooperative = Address::generate(&env);
    let transporter = Address::generate(&env);

    let (token_addr, token_admin, token_client) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &1_000_000);

    let contract_id = env.register(PaymentDistributionContract, ());
    let client = PaymentDistributionContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let stakeholders = Vec::from_array(
        &env,
        [
            stakeholder(&env, &farmer, "Farmer", 6000),
            stakeholder(&env, &cooperative, "Cooperative", 2500),
            stakeholder(&env, &transporter, "Transporter", 1500),
        ],
    );

    let id = client.create_manifest(
        &creator,
        &buyer,
        &token_addr,
        &String::from_str(&env, "Cocoa shipment #42"),
        &stakeholders,
    );
    assert_eq!(id, 0);

    client.fund_and_distribute(&buyer, &id, &100_000);

    // Exact split with remainder going to the last stakeholder.
    assert_eq!(token_client.balance(&farmer), 60_000);
    assert_eq!(token_client.balance(&cooperative), 25_000);
    assert_eq!(token_client.balance(&transporter), 15_000);
    assert_eq!(token_client.balance(&buyer), 900_000);

    let settlement = client.get_settlement(&id);
    assert_eq!(settlement.total_amount, 100_000);
    assert_eq!(settlement.payouts.len(), 3);

    let manifest = client.get_manifest(&id);
    match manifest.status {
        ManifestStatus::Settled => {}
        _ => panic!("expected Settled"),
    }

    // Double funding must fail.
    let result = client.try_fund_and_distribute(&buyer, &id, &1);
    assert!(result.is_err());
}

#[test]
fn rejects_shares_not_summing_to_10000() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let farmer = Address::generate(&env);
    let (token_addr, _, _) = create_token_contract(&env, &admin);

    let contract_id = env.register(PaymentDistributionContract, ());
    let client = PaymentDistributionContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let bad = Vec::from_array(&env, [stakeholder(&env, &farmer, "Farmer", 9000)]);
    let result = client.try_create_manifest(
        &creator,
        &buyer,
        &token_addr,
        &String::from_str(&env, "Bad manifest"),
        &bad,
    );
    assert!(result.is_err());
}

#[test]
fn rounding_remainder_reconciles_exactly() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let c = Address::generate(&env);

    let (token_addr, token_admin, token_client) = create_token_contract(&env, &admin);
    token_admin.mint(&buyer, &1_000);

    let contract_id = env.register(PaymentDistributionContract, ());
    let client = PaymentDistributionContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    // 3-way split of odd amount to force rounding.
    let stakeholders = Vec::from_array(
        &env,
        [
            stakeholder(&env, &a, "A", 3334),
            stakeholder(&env, &b, "B", 3333),
            stakeholder(&env, &c, "C", 3333),
        ],
    );
    let id = client.create_manifest(
        &creator,
        &buyer,
        &token_addr,
        &String::from_str(&env, "Odd split"),
        &stakeholders,
    );
    client.fund_and_distribute(&buyer, &id, &101);

    let sum = token_client.balance(&a) + token_client.balance(&b) + token_client.balance(&c);
    assert_eq!(sum, 101);
}

#[test]
fn cancel_prevents_future_funding() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let buyer = Address::generate(&env);
    let farmer = Address::generate(&env);
    let (token_addr, _, _) = create_token_contract(&env, &admin);

    let contract_id = env.register(PaymentDistributionContract, ());
    let client = PaymentDistributionContractClient::new(&env, &contract_id);
    client.initialize(&admin);

    let stakeholders = Vec::from_array(&env, [stakeholder(&env, &farmer, "Farmer", 10000)]);
    let id = client.create_manifest(
        &creator,
        &buyer,
        &token_addr,
        &String::from_str(&env, "Cancel me"),
        &stakeholders,
    );
    client.cancel_manifest(&creator, &id);

    let result = client.try_fund_and_distribute(&buyer, &id, &10);
    assert!(result.is_err());
}
