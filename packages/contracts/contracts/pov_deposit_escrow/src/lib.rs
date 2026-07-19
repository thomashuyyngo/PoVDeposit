#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contract]
pub struct PovDepositEscrow;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Arbitrator,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
}

#[contractimpl]
impl PovDepositEscrow {
    pub fn initialize(env: Env, admin: Address, arbitrator: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator, &arbitrator);
        Ok(())
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn arbitrator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Arbitrator).unwrap()
    }
}

mod test;
