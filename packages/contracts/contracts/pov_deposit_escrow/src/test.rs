#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

#[test]
fn initializes_with_an_authorized_arbitrator() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let payment_asset = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);

    assert_eq!(client.admin(), admin);
    assert_eq!(client.arbitrator(), arbitrator);
}

#[test]
fn creates_a_booking_pending_deposit_funding() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let payment_asset = Address::generate(&env);
    let renter = Address::generate(&env);
    let host = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);

    assert_eq!(booking_id, 1);
    let booking = client.booking(&booking_id);
    assert_eq!(booking.renter, renter);
    assert_eq!(booking.host, host);
    assert_eq!(booking.deposit_amount, 500_000_000i128);
    assert_eq!(booking.state, BookingState::PendingFunding);
}

#[test]
fn funds_a_pending_booking_with_the_configured_asset() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let asset_admin = Address::generate(&env);
    let payment_asset = env.register_stellar_asset_contract_v2(asset_admin).address();
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let token = token::StellarAssetClient::new(&env, &payment_asset);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);
    token.mint(&renter, &500_000_000i128);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);

    client.fund_booking(&renter, &booking_id);

    assert_eq!(token.balance(&contract_id), 500_000_000i128);
    assert_eq!(client.booking(&booking_id).state, BookingState::Funded);
}

#[test]
fn releases_a_funded_booking_to_its_host() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let payment_asset = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let token = token::StellarAssetClient::new(&env, &payment_asset);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);
    token.mint(&renter, &500_000_000i128);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);
    client.fund_booking(&renter, &booking_id);
    client.check_in(&host, &booking_id);
    client.release_booking(&host, &booking_id);

    assert_eq!(token.balance(&host), 500_000_000i128);
    assert_eq!(client.booking(&booking_id).state, BookingState::Released);
}

#[test]
fn records_check_in_before_release() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let payment_asset = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let token = token::StellarAssetClient::new(&env, &payment_asset);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);
    token.mint(&renter, &500_000_000i128);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);
    client.fund_booking(&renter, &booking_id);
    client.check_in(&host, &booking_id);

    assert_eq!(client.booking(&booking_id).state, BookingState::CheckedIn);
}

#[test]
fn refunds_a_funded_booking_when_the_arbitrator_approves() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let payment_asset = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let token = token::StellarAssetClient::new(&env, &payment_asset);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator, &payment_asset);
    token.mint(&renter, &500_000_000i128);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);
    client.fund_booking(&renter, &booking_id);
    client.refund_booking(&arbitrator, &booking_id);

    assert_eq!(token.balance(&renter), 500_000_000i128);
    assert_eq!(client.booking(&booking_id).state, BookingState::Refunded);
}
