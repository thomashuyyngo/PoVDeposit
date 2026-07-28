#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, BytesN, Env,
};

const DEPOSIT: i128 = 100_000_000;
const VISIT: u64 = 2_000;
const CHECK_DEADLINE: u64 = 2_100;
const CONFIRM_DEADLINE: u64 = 2_500;

struct Setup {
    env: Env,
    contract_id: Address,
    admin: Address,
    arbitrator: Address,
    renter: Address,
    host: Address,
    asset: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.ledger().set_timestamp(1_000);
    let contract_id = env.register(VisitDepositEscrow, ());
    let admin = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let renter = Address::generate(&env);
    let host = Address::generate(&env);
    let asset = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let config = EscrowConfig {
        admin: admin.clone(),
        arbitrator: arbitrator.clone(),
        accepted_asset: asset.clone(),
        fee_recipient: admin.clone(),
        platform_fee_bps: 100,
        min_deposit: 1,
        max_deposit: 1_000_000_000,
        check_in_window: 300,
        confirmation_window: 400,
        paused: false,
        version: VERSION,
    };
    env.mock_all_auths();
    VisitDepositEscrowClient::new(&env, &contract_id).initialize(&config);
    Setup {
        env,
        contract_id,
        admin,
        arbitrator,
        renter,
        host,
        asset,
    }
}

fn create(setup: &Setup, booking_id: u64) {
    VisitDepositEscrowClient::new(&setup.env, &setup.contract_id).create_booking(
        &booking_id,
        &setup.renter,
        &setup.host,
        &DEPOSIT,
        &VISIT,
        &CHECK_DEADLINE,
        &CONFIRM_DEADLINE,
        &BytesN::from_array(&setup.env, &[1; 32]),
    );
}

fn fund(setup: &Setup, booking_id: u64) {
    token::StellarAssetClient::new(&setup.env, &setup.asset).mint(&setup.renter, &DEPOSIT);
    VisitDepositEscrowClient::new(&setup.env, &setup.contract_id)
        .fund_booking(&setup.renter, &booking_id);
}

#[test]
fn initializes_once_with_bounded_configuration() {
    let setup = setup();
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    assert_eq!(client.get_config().admin, setup.admin);
    assert!(client.try_initialize(&client.get_config()).is_err());
}

#[test]
fn rejects_invalid_config_and_booking_bounds() {
    let setup = setup();
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    assert!(client
        .try_create_booking(
            &1,
            &setup.renter,
            &setup.host,
            &0,
            &VISIT,
            &CHECK_DEADLINE,
            &CONFIRM_DEADLINE,
            &BytesN::from_array(&setup.env, &[1; 32]),
        )
        .is_err());
    assert!(client
        .try_create_booking(
            &2,
            &setup.renter,
            &setup.host,
            &DEPOSIT,
            &VISIT,
            &(VISIT - 1),
            &CONFIRM_DEADLINE,
            &BytesN::from_array(&setup.env, &[1; 32]),
        )
        .is_err());
}

#[test]
fn creates_unique_booking_ids() {
    let setup = setup();
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    create(&setup, 7);
    assert_eq!(client.get_booking(&7).state, BookingState::Created);
    assert!(client
        .try_create_booking(
            &7,
            &setup.renter,
            &setup.host,
            &DEPOSIT,
            &VISIT,
            &CHECK_DEADLINE,
            &CONFIRM_DEADLINE,
            &BytesN::from_array(&setup.env, &[2; 32]),
        )
        .is_err());
}

#[test]
fn funds_once_and_preserves_escrow_liability() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    assert_eq!(client.get_booking(&1).state, BookingState::Funded);
    assert_eq!(
        token::Client::new(&setup.env, &setup.asset).balance(&setup.contract_id),
        DEPOSIT
    );
    assert!(client.try_fund_booking(&setup.renter, &1).is_err());
}

#[test]
fn renter_cancels_before_funding() {
    let setup = setup();
    create(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.cancel_by_renter(&setup.renter, &1);
    assert_eq!(
        client.get_booking(&1).state,
        BookingState::CancelledByRenter
    );
}

#[test]
fn host_cancellation_refunds_a_funded_booking() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.cancel_by_host(&setup.host, &1);
    assert_eq!(client.get_booking(&1).state, BookingState::Refunded);
    assert_eq!(
        token::Client::new(&setup.env, &setup.asset).balance(&setup.renter),
        DEPOSIT
    );
}

#[test]
fn rejects_early_check_in_then_refunds_confirmed_visit() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    let proof = BytesN::from_array(&setup.env, &[3; 32]);
    assert!(client.try_check_in(&setup.renter, &1, &proof).is_err());

    setup.env.ledger().set_timestamp(VISIT - 100);
    client.check_in(&setup.renter, &1, &proof);
    client.confirm_visit(&setup.host, &1);
    assert_eq!(client.get_booking(&1).state, BookingState::Refunded);
    assert_eq!(
        token::Client::new(&setup.env, &setup.asset).balance(&setup.renter),
        DEPOSIT
    );
}

#[test]
fn renter_no_show_releases_to_host() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    setup.env.ledger().set_timestamp(CHECK_DEADLINE + 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.report_renter_no_show(&setup.host, &1);
    assert_eq!(client.get_booking(&1).state, BookingState::Released);
    let token = token::Client::new(&setup.env, &setup.asset);
    assert_eq!(token.balance(&setup.host), 99_000_000);
    assert_eq!(token.balance(&setup.admin), 1_000_000);
}

#[test]
fn host_no_show_refunds_renter() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    setup.env.ledger().set_timestamp(CHECK_DEADLINE + 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.report_host_no_show(&setup.renter, &1);
    assert_eq!(client.get_booking(&1).state, BookingState::Refunded);
}

#[test]
fn arbitrator_can_split_only_a_disputed_booking() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    assert!(client
        .try_resolve_dispute(&setup.arbitrator, &1, &DisputeResolution::Refund)
        .is_err());
    client.open_dispute(&setup.renter, &1, &BytesN::from_array(&setup.env, &[4; 32]));
    client.respond_to_dispute(&setup.host, &1, &BytesN::from_array(&setup.env, &[5; 32]));
    client.resolve_dispute(&setup.arbitrator, &1, &DisputeResolution::Split(40_000_000));
    let token = token::Client::new(&setup.env, &setup.asset);
    assert_eq!(token.balance(&setup.renter), 40_000_000);
    assert_eq!(token.balance(&setup.host), 60_000_000);
    assert!(client
        .try_resolve_dispute(&setup.arbitrator, &1, &DisputeResolution::Refund)
        .is_err());
}

#[test]
fn unauthorized_arbitrator_cannot_resolve() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.open_dispute(&setup.renter, &1, &BytesN::from_array(&setup.env, &[4; 32]));
    assert!(client
        .try_resolve_dispute(
            &Address::generate(&setup.env),
            &1,
            &DisputeResolution::Refund,
        )
        .is_err());
}

#[test]
fn expiration_refunds_funded_liability_once() {
    let setup = setup();
    create(&setup, 1);
    fund(&setup, 1);
    setup.env.ledger().set_timestamp(CONFIRM_DEADLINE + 1);
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.expire_booking(&1);
    assert_eq!(client.get_booking(&1).state, BookingState::Refunded);
    assert!(client.try_expire_booking(&1).is_err());
}

#[test]
fn pause_blocks_new_liabilities_but_not_safe_settlement() {
    let setup = setup();
    let client = VisitDepositEscrowClient::new(&setup.env, &setup.contract_id);
    client.pause(&setup.admin);
    assert!(client
        .try_create_booking(
            &1,
            &setup.renter,
            &setup.host,
            &DEPOSIT,
            &VISIT,
            &CHECK_DEADLINE,
            &CONFIRM_DEADLINE,
            &BytesN::from_array(&setup.env, &[1; 32]),
        )
        .is_err());
    client.unpause(&setup.admin);
    create(&setup, 1);
    assert_eq!(client.get_booking(&1).state, BookingState::Created);
}
