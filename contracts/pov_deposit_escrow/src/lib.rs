#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

const MIN_DEPOSIT: i128 = 100_000;
const MAX_DEPOSIT: i128 = 1_000_000_000;
const TTL_THRESHOLD: u32 = 14 * 17_280;
const TTL_EXTEND_TO: u32 = 90 * 17_280;

#[contract]
pub struct VisitDepositEscrow;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Asset,
    Booking(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BookingState {
    Created,
    Funded,
    Refunded,
    Released,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Booking {
    pub booking_id: u64,
    pub renter: Address,
    pub host: Address,
    pub deposit_amount: i128,
    pub visit_time: u64,
    pub state: BookingState,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    BookingAlreadyExists = 3,
    BookingNotFound = 4,
    InvalidBookingState = 5,
    Unauthorized = 6,
    InvalidBooking = 7,
}

#[contractevent]
pub struct BookingCreated {
    #[topic]
    pub booking_id: u64,
    pub renter: Address,
    pub host: Address,
    pub deposit_amount: i128,
}

#[contractevent]
pub struct BookingFunded {
    #[topic]
    pub booking_id: u64,
    pub amount: i128,
}

#[contractevent]
pub struct DepositRefunded {
    #[topic]
    pub booking_id: u64,
    pub amount: i128,
}

#[contractevent]
pub struct VisitConfirmed {
    #[topic]
    pub booking_id: u64,
    pub amount: i128,
}

fn asset(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::Asset)
        .ok_or(ContractError::NotInitialized)
}

fn read_booking(env: &Env, booking_id: u64) -> Result<Booking, ContractError> {
    let key = DataKey::Booking(booking_id);
    let booking = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(ContractError::BookingNotFound)?;
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
    Ok(booking)
}

fn write_booking(env: &Env, booking: &Booking) {
    let key = DataKey::Booking(booking.booking_id);
    env.storage().persistent().set(&key, booking);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
    token::Client::new(env, &asset(env).unwrap()).transfer(from, to, &amount);
}

#[contractimpl]
impl VisitDepositEscrow {
    pub fn initialize(
        env: Env,
        admin: Address,
        accepted_asset: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Asset) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::Asset, &accepted_asset);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    pub fn create_booking(
        env: Env,
        booking_id: u64,
        renter: Address,
        host: Address,
        deposit_amount: i128,
        visit_time: u64,
    ) -> Result<(), ContractError> {
        asset(&env)?;
        if env
            .storage()
            .persistent()
            .has(&DataKey::Booking(booking_id))
        {
            return Err(ContractError::BookingAlreadyExists);
        }
        if renter == host
            || !(MIN_DEPOSIT..=MAX_DEPOSIT).contains(&deposit_amount)
            || visit_time <= env.ledger().timestamp()
        {
            return Err(ContractError::InvalidBooking);
        }
        renter.require_auth();
        write_booking(
            &env,
            &Booking {
                booking_id,
                renter: renter.clone(),
                host: host.clone(),
                deposit_amount,
                visit_time,
                state: BookingState::Created,
            },
        );
        BookingCreated {
            booking_id,
            renter,
            host,
            deposit_amount,
        }
        .publish(&env);
        Ok(())
    }

    pub fn booking(env: Env, booking_id: u64) -> Result<Booking, ContractError> {
        read_booking(&env, booking_id)
    }

    pub fn fund_booking(env: Env, renter: Address, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::Unauthorized);
        }
        if booking.state != BookingState::Created {
            return Err(ContractError::InvalidBookingState);
        }
        renter.require_auth();
        transfer(
            &env,
            &renter,
            &env.current_contract_address(),
            booking.deposit_amount,
        );
        booking.state = BookingState::Funded;
        write_booking(&env, &booking);
        BookingFunded {
            booking_id,
            amount: booking.deposit_amount,
        }
        .publish(&env);
        Ok(())
    }

    pub fn cancel_booking(env: Env, renter: Address, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::Unauthorized);
        }
        if booking.state != BookingState::Created && booking.state != BookingState::Funded {
            return Err(ContractError::InvalidBookingState);
        }
        if env.ledger().timestamp() >= booking.visit_time {
            return Err(ContractError::InvalidBookingState);
        }
        renter.require_auth();
        if booking.state == BookingState::Funded {
            transfer(
                &env,
                &env.current_contract_address(),
                &renter,
                booking.deposit_amount,
            );
        }
        booking.state = BookingState::Refunded;
        write_booking(&env, &booking);
        DepositRefunded {
            booking_id,
            amount: booking.deposit_amount,
        }
        .publish(&env);
        Ok(())
    }

    pub fn confirm_visit(env: Env, host: Address, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.host != host {
            return Err(ContractError::Unauthorized);
        }
        if booking.state != BookingState::Funded || env.ledger().timestamp() < booking.visit_time {
            return Err(ContractError::InvalidBookingState);
        }
        host.require_auth();
        transfer(
            &env,
            &env.current_contract_address(),
            &booking.renter,
            booking.deposit_amount,
        );
        booking.state = BookingState::Released;
        write_booking(&env, &booking);
        VisitConfirmed {
            booking_id,
            amount: booking.deposit_amount,
        }
        .publish(&env);
        Ok(())
    }
}

mod test;
