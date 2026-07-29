#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

fn setup() -> (
    Env,
    VisitDepositEscrowClient<'static>,
    token::Client<'static>,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let admin = Address::generate(&env);
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let issuer = Address::generate(&env);
    let asset_id = env.register_stellar_asset_contract_v2(issuer);
    let asset_admin = token::StellarAssetClient::new(&env, &asset_id.address());
    let asset = token::Client::new(&env, &asset_id.address());
    let contract_id = env.register(VisitDepositEscrow, ());
    let client = VisitDepositEscrowClient::new(&env, &contract_id);
    client.initialize(&admin, &asset_id.address());
    asset_admin.mint(&renter, &10_000_000);
    (env, client, asset, renter, host)
}

#[test]
fn funds_and_refunds_before_the_visit() {
    let (_env, client, asset, renter, host) = setup();
    client.create_booking(&1, &renter, &host, &1_000_000, &2_000);
    client.fund_booking(&renter, &1);
    assert_eq!(asset.balance(&renter), 9_000_000);
    client.cancel_booking(&renter, &1);
    assert_eq!(asset.balance(&renter), 10_000_000);
    assert_eq!(client.booking(&1).state, BookingState::Refunded);
}

#[test]
fn host_confirmation_returns_the_deposit_after_the_visit() {
    let (env, client, asset, renter, host) = setup();
    client.create_booking(&2, &renter, &host, &1_000_000, &2_000);
    client.fund_booking(&renter, &2);
    env.ledger().set_timestamp(2_000);
    client.confirm_visit(&host, &2);
    assert_eq!(asset.balance(&renter), 10_000_000);
    assert_eq!(client.booking(&2).state, BookingState::Released);
}

#[test]
fn rejects_invalid_or_duplicate_bookings() {
    let (_env, client, _asset, renter, host) = setup();
    assert_eq!(
        client.try_create_booking(&1, &renter, &renter, &1_000_000, &2_000),
        Err(Ok(ContractError::InvalidBooking))
    );
    client.create_booking(&1, &renter, &host, &1_000_000, &2_000);
    assert_eq!(
        client.try_create_booking(&1, &renter, &host, &1_000_000, &2_000),
        Err(Ok(ContractError::BookingAlreadyExists))
    );
}

#[test]
fn uses_a_low_cost_ninety_day_ttl() {
    assert_eq!(TTL_THRESHOLD, 14 * 17_280);
    assert_eq!(TTL_EXTEND_TO, 90 * 17_280);
}
