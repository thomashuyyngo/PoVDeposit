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
