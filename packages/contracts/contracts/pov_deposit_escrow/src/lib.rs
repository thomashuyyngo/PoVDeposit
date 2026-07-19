#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env};

#[contract]
pub struct PovDepositEscrow;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Arbitrator,
    PaymentAsset,
    BookingCount,
    Booking(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BookingState {
    PendingFunding = 1,
    Funded = 2,
    Released = 3,
    Refunded = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Booking {
    pub renter: Address,
    pub host: Address,
    pub deposit_amount: i128,
    pub state: BookingState,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    InvalidBookingState = 2,
    UnauthorizedRenter = 3,
    UnauthorizedHost = 4,
    UnauthorizedArbitrator = 5,
}

#[contractimpl]
impl PovDepositEscrow {
    pub fn initialize(
        env: Env,
        admin: Address,
        arbitrator: Address,
        payment_asset: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Arbitrator, &arbitrator);
        env.storage()
            .instance()
            .set(&DataKey::PaymentAsset, &payment_asset);
        Ok(())
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn arbitrator(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Arbitrator).unwrap()
    }

    pub fn create_booking(env: Env, renter: Address, host: Address, deposit_amount: i128) -> u64 {
        renter.require_auth();

        let booking_id = env
            .storage()
            .instance()
            .get::<_, u64>(&DataKey::BookingCount)
            .unwrap_or(0)
            + 1;
        let booking = Booking {
            renter,
            host,
            deposit_amount,
            state: BookingState::PendingFunding,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Booking(booking_id), &booking);
        env.storage()
            .instance()
            .set(&DataKey::BookingCount, &booking_id);
        booking_id
    }

    pub fn booking(env: Env, booking_id: u64) -> Booking {
        env.storage()
            .persistent()
            .get(&DataKey::Booking(booking_id))
            .unwrap()
    }

    pub fn fund_booking(
        env: Env,
        renter: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let key = DataKey::Booking(booking_id);
        let mut booking: Booking = env.storage().persistent().get(&key).unwrap();
        if booking.renter != renter {
            return Err(ContractError::UnauthorizedRenter);
        }
        if booking.state != BookingState::PendingFunding {
            return Err(ContractError::InvalidBookingState);
        }

        renter.require_auth();
        let payment_asset: Address = env
            .storage()
            .instance()
            .get(&DataKey::PaymentAsset)
            .unwrap();
        token::Client::new(&env, &payment_asset).transfer(
            &renter,
            &env.current_contract_address(),
            &booking.deposit_amount,
        );
        booking.state = BookingState::Funded;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    pub fn release_booking(
        env: Env,
        host: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let key = DataKey::Booking(booking_id);
        let mut booking: Booking = env.storage().persistent().get(&key).unwrap();
        if booking.host != host {
            return Err(ContractError::UnauthorizedHost);
        }
        if booking.state != BookingState::Funded {
            return Err(ContractError::InvalidBookingState);
        }

        host.require_auth();
        let payment_asset: Address = env
            .storage()
            .instance()
            .get(&DataKey::PaymentAsset)
            .unwrap();
        token::Client::new(&env, &payment_asset).transfer(
            &env.current_contract_address(),
            &host,
            &booking.deposit_amount,
        );
        booking.state = BookingState::Released;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }

    pub fn refund_booking(
        env: Env,
        arbitrator: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let expected_arbitrator: Address = env
            .storage()
            .instance()
            .get(&DataKey::Arbitrator)
            .unwrap();
        if arbitrator != expected_arbitrator {
            return Err(ContractError::UnauthorizedArbitrator);
        }

        let key = DataKey::Booking(booking_id);
        let mut booking: Booking = env.storage().persistent().get(&key).unwrap();
        if booking.state != BookingState::Funded {
            return Err(ContractError::InvalidBookingState);
        }

        arbitrator.require_auth();
        let payment_asset: Address = env
            .storage()
            .instance()
            .get(&DataKey::PaymentAsset)
            .unwrap();
        token::Client::new(&env, &payment_asset).transfer(
            &env.current_contract_address(),
            &booking.renter,
            &booking.deposit_amount,
        );
        booking.state = BookingState::Refunded;
        env.storage().persistent().set(&key, &booking);
        Ok(())
    }
}

mod test;
