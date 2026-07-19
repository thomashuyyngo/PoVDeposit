#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn initializes_with_an_authorized_arbitrator() {
    let env = Env::default();
    let contract_id = env.register(PovDepositEscrow, ());
    let client = PovDepositEscrowClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator);

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
    let renter = Address::generate(&env);
    let host = Address::generate(&env);

    env.mock_all_auths();
    client.initialize(&admin, &arbitrator);
    let booking_id = client.create_booking(&renter, &host, &500_000_000i128);

    assert_eq!(booking_id, 1);
    let booking = client.booking(&booking_id);
    assert_eq!(booking.renter, renter);
    assert_eq!(booking.host, host);
    assert_eq!(booking.deposit_amount, 500_000_000i128);
    assert_eq!(booking.state, BookingState::PendingFunding);
}
