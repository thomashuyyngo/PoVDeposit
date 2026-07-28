#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, BytesN, Env,
};

const VERSION: u32 = 1;
const MAX_FEE_BPS: u32 = 1_000;
const TTL_THRESHOLD: u32 = 30 * 17_280;
const TTL_EXTEND_TO: u32 = 365 * 17_280;

#[contract]
pub struct VisitDepositEscrow;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Config,
    Booking(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowConfig {
    pub admin: Address,
    pub arbitrator: Address,
    pub accepted_asset: Address,
    pub fee_recipient: Address,
    pub platform_fee_bps: u32,
    pub min_deposit: i128,
    pub max_deposit: i128,
    pub check_in_window: u64,
    pub confirmation_window: u64,
    pub paused: bool,
    pub version: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BookingState {
    Created,
    Funded,
    CancelledByRenter,
    CancelledByHost,
    CheckedIn,
    VisitConfirmed,
    RenterNoShow,
    HostNoShow,
    Disputed,
    Refunded,
    Released,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeResolution {
    Refund,
    Release,
    Split(i128),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Booking {
    pub booking_id: u64,
    pub renter: Address,
    pub host: Address,
    pub deposit_amount: i128,
    pub visit_time: u64,
    pub check_in_deadline: u64,
    pub confirmation_deadline: u64,
    pub evidence_hash: BytesN<32>,
    pub response_hash: Option<BytesN<32>>,
    pub check_in_proof_hash: Option<BytesN<32>>,
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
    UnauthorizedRenter = 6,
    UnauthorizedHost = 7,
    UnauthorizedParticipant = 8,
    UnauthorizedArbitrator = 9,
    UnauthorizedAdmin = 10,
    InvalidDeposit = 11,
    InvalidDeadlines = 12,
    OutsideCheckInWindow = 13,
    PlatformPaused = 14,
    InvalidResolution = 15,
    InvalidConfig = 16,
    ArithmeticOverflow = 17,
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
pub struct BookingCancelled {
    #[topic]
    pub booking_id: u64,
    pub state: BookingState,
}

#[contractevent]
pub struct RenterCheckedIn {
    #[topic]
    pub booking_id: u64,
    pub proof_hash: BytesN<32>,
}

#[contractevent]
pub struct VisitConfirmed {
    #[topic]
    pub booking_id: u64,
}

#[contractevent]
pub struct NoShowReported {
    #[topic]
    pub booking_id: u64,
    pub state: BookingState,
}

#[contractevent]
pub struct DisputeOpened {
    #[topic]
    pub booking_id: u64,
    pub evidence_hash: BytesN<32>,
}

#[contractevent]
pub struct DisputeResponded {
    #[topic]
    pub booking_id: u64,
    pub evidence_hash: BytesN<32>,
}

#[contractevent]
pub struct DisputeResolved {
    #[topic]
    pub booking_id: u64,
    pub resolution: DisputeResolution,
}

#[contractevent]
pub struct DepositRefunded {
    #[topic]
    pub booking_id: u64,
    pub amount: i128,
}

#[contractevent]
pub struct DepositReleased {
    #[topic]
    pub booking_id: u64,
    pub amount: i128,
}

#[contractevent]
pub struct DepositSplit {
    #[topic]
    pub booking_id: u64,
    pub renter_amount: i128,
    pub host_amount: i128,
}

#[contractevent]
pub struct BookingExpired {
    #[topic]
    pub booking_id: u64,
}

#[contractevent]
pub struct ContractPaused {
    #[topic]
    pub admin: Address,
}

#[contractevent]
pub struct ContractUnpaused {
    #[topic]
    pub admin: Address,
}

fn validate_config(value: &EscrowConfig) -> Result<(), ContractError> {
    if value.platform_fee_bps > MAX_FEE_BPS
        || value.min_deposit <= 0
        || value.max_deposit < value.min_deposit
        || value.check_in_window == 0
        || value.confirmation_window == 0
        || value.version != VERSION
    {
        return Err(ContractError::InvalidConfig);
    }
    Ok(())
}

fn config(env: &Env) -> Result<EscrowConfig, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::Config)
        .ok_or(ContractError::NotInitialized)
}

fn write_config(env: &Env, value: &EscrowConfig) {
    env.storage().instance().set(&DataKey::Config, value);
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn require_running(env: &Env) -> Result<EscrowConfig, ContractError> {
    let value = config(env)?;
    if value.paused {
        return Err(ContractError::PlatformPaused);
    }
    Ok(value)
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

fn asset(env: &Env) -> Result<Address, ContractError> {
    Ok(config(env)?.accepted_asset)
}

fn transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
    token::Client::new(env, &asset(env).unwrap()).transfer(from, to, &amount);
}

fn refund(env: &Env, booking: &mut Booking) {
    transfer(
        env,
        &env.current_contract_address(),
        &booking.renter,
        booking.deposit_amount,
    );
    booking.state = BookingState::Refunded;
    write_booking(env, booking);
    DepositRefunded {
        booking_id: booking.booking_id,
        amount: booking.deposit_amount,
    }
    .publish(env);
}

fn release(env: &Env, booking: &mut Booking) -> Result<(), ContractError> {
    let cfg = config(env)?;
    let fee = booking
        .deposit_amount
        .checked_mul(i128::from(cfg.platform_fee_bps))
        .and_then(|value| value.checked_div(10_000))
        .ok_or(ContractError::ArithmeticOverflow)?;
    let host_amount = booking
        .deposit_amount
        .checked_sub(fee)
        .ok_or(ContractError::ArithmeticOverflow)?;
    if fee > 0 {
        transfer(
            env,
            &env.current_contract_address(),
            &cfg.fee_recipient,
            fee,
        );
    }
    transfer(
        env,
        &env.current_contract_address(),
        &booking.host,
        host_amount,
    );
    booking.state = BookingState::Released;
    write_booking(env, booking);
    DepositReleased {
        booking_id: booking.booking_id,
        amount: host_amount,
    }
    .publish(env);
    Ok(())
}

fn require_participant(booking: &Booking, actor: &Address) -> Result<(), ContractError> {
    if actor != &booking.renter && actor != &booking.host {
        return Err(ContractError::UnauthorizedParticipant);
    }
    Ok(())
}

#[contractimpl]
impl VisitDepositEscrow {
    pub fn initialize(env: Env, config: EscrowConfig) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Config) {
            return Err(ContractError::AlreadyInitialized);
        }
        validate_config(&config)?;
        config.admin.require_auth();
        write_config(&env, &config);
        Ok(())
    }

    pub fn get_config(env: Env) -> Result<EscrowConfig, ContractError> {
        config(&env)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_booking(
        env: Env,
        booking_id: u64,
        renter: Address,
        host: Address,
        deposit_amount: i128,
        visit_time: u64,
        check_in_deadline: u64,
        confirmation_deadline: u64,
        evidence_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        let cfg = require_running(&env)?;
        if env
            .storage()
            .persistent()
            .has(&DataKey::Booking(booking_id))
        {
            return Err(ContractError::BookingAlreadyExists);
        }
        if deposit_amount < cfg.min_deposit || deposit_amount > cfg.max_deposit {
            return Err(ContractError::InvalidDeposit);
        }
        if renter == host
            || visit_time <= env.ledger().timestamp()
            || check_in_deadline < visit_time
            || confirmation_deadline <= check_in_deadline
        {
            return Err(ContractError::InvalidDeadlines);
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
                check_in_deadline,
                confirmation_deadline,
                evidence_hash,
                response_hash: None,
                check_in_proof_hash: None,
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

    pub fn get_booking(env: Env, booking_id: u64) -> Result<Booking, ContractError> {
        read_booking(&env, booking_id)
    }

    pub fn booking(env: Env, booking_id: u64) -> Result<Booking, ContractError> {
        read_booking(&env, booking_id)
    }

    pub fn fund_booking(env: Env, renter: Address, booking_id: u64) -> Result<(), ContractError> {
        require_running(&env)?;
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::UnauthorizedRenter);
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

    pub fn cancel_by_renter(
        env: Env,
        renter: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::UnauthorizedRenter);
        }
        renter.require_auth();
        match booking.state {
            BookingState::Created => {
                booking.state = BookingState::CancelledByRenter;
                write_booking(&env, &booking);
                BookingCancelled {
                    booking_id,
                    state: booking.state,
                }
                .publish(&env);
            }
            BookingState::Funded if env.ledger().timestamp() < booking.visit_time => {
                refund(&env, &mut booking);
            }
            _ => return Err(ContractError::InvalidBookingState),
        }
        Ok(())
    }

    pub fn cancel_booking(env: Env, renter: Address, booking_id: u64) -> Result<(), ContractError> {
        Self::cancel_by_renter(env, renter, booking_id)
    }

    pub fn cancel_by_host(env: Env, host: Address, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.host != host {
            return Err(ContractError::UnauthorizedHost);
        }
        host.require_auth();
        match booking.state {
            BookingState::Created => {
                booking.state = BookingState::CancelledByHost;
                write_booking(&env, &booking);
                BookingCancelled {
                    booking_id,
                    state: booking.state,
                }
                .publish(&env);
            }
            BookingState::Funded => refund(&env, &mut booking),
            _ => return Err(ContractError::InvalidBookingState),
        }
        Ok(())
    }

    pub fn check_in(
        env: Env,
        renter: Address,
        booking_id: u64,
        proof_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        let cfg = config(&env)?;
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::UnauthorizedRenter);
        }
        if booking.state != BookingState::Funded {
            return Err(ContractError::InvalidBookingState);
        }
        let starts_at = booking.visit_time.saturating_sub(cfg.check_in_window);
        let now = env.ledger().timestamp();
        if now < starts_at || now > booking.check_in_deadline {
            return Err(ContractError::OutsideCheckInWindow);
        }
        renter.require_auth();
        booking.check_in_proof_hash = Some(proof_hash.clone());
        booking.state = BookingState::CheckedIn;
        write_booking(&env, &booking);
        RenterCheckedIn {
            booking_id,
            proof_hash,
        }
        .publish(&env);
        Ok(())
    }

    pub fn confirm_visit(env: Env, host: Address, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.host != host {
            return Err(ContractError::UnauthorizedHost);
        }
        if booking.state != BookingState::CheckedIn
            || env.ledger().timestamp() > booking.confirmation_deadline
        {
            return Err(ContractError::InvalidBookingState);
        }
        host.require_auth();
        booking.state = BookingState::VisitConfirmed;
        write_booking(&env, &booking);
        VisitConfirmed { booking_id }.publish(&env);
        refund(&env, &mut booking);
        Ok(())
    }

    pub fn report_renter_no_show(
        env: Env,
        host: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.host != host {
            return Err(ContractError::UnauthorizedHost);
        }
        if booking.state != BookingState::Funded
            || env.ledger().timestamp() <= booking.check_in_deadline
        {
            return Err(ContractError::InvalidBookingState);
        }
        host.require_auth();
        booking.state = BookingState::RenterNoShow;
        write_booking(&env, &booking);
        NoShowReported {
            booking_id,
            state: booking.state.clone(),
        }
        .publish(&env);
        release(&env, &mut booking)?;
        Ok(())
    }

    pub fn report_host_no_show(
        env: Env,
        renter: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if booking.renter != renter {
            return Err(ContractError::UnauthorizedRenter);
        }
        if booking.state != BookingState::Funded
            || env.ledger().timestamp() <= booking.check_in_deadline
        {
            return Err(ContractError::InvalidBookingState);
        }
        renter.require_auth();
        booking.state = BookingState::HostNoShow;
        write_booking(&env, &booking);
        NoShowReported {
            booking_id,
            state: booking.state.clone(),
        }
        .publish(&env);
        refund(&env, &mut booking);
        Ok(())
    }

    pub fn open_dispute(
        env: Env,
        actor: Address,
        booking_id: u64,
        evidence_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        require_participant(&booking, &actor)?;
        if booking.state != BookingState::Funded && booking.state != BookingState::CheckedIn {
            return Err(ContractError::InvalidBookingState);
        }
        actor.require_auth();
        booking.evidence_hash = evidence_hash.clone();
        booking.state = BookingState::Disputed;
        write_booking(&env, &booking);
        DisputeOpened {
            booking_id,
            evidence_hash,
        }
        .publish(&env);
        Ok(())
    }

    pub fn respond_to_dispute(
        env: Env,
        actor: Address,
        booking_id: u64,
        evidence_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        require_participant(&booking, &actor)?;
        if booking.state != BookingState::Disputed {
            return Err(ContractError::InvalidBookingState);
        }
        actor.require_auth();
        booking.response_hash = Some(evidence_hash.clone());
        write_booking(&env, &booking);
        DisputeResponded {
            booking_id,
            evidence_hash,
        }
        .publish(&env);
        Ok(())
    }

    pub fn resolve_dispute(
        env: Env,
        arbitrator: Address,
        booking_id: u64,
        resolution: DisputeResolution,
    ) -> Result<(), ContractError> {
        let cfg = config(&env)?;
        if cfg.arbitrator != arbitrator {
            return Err(ContractError::UnauthorizedArbitrator);
        }
        let mut booking = read_booking(&env, booking_id)?;
        if booking.state != BookingState::Disputed {
            return Err(ContractError::InvalidBookingState);
        }
        arbitrator.require_auth();
        DisputeResolved {
            booking_id,
            resolution: resolution.clone(),
        }
        .publish(&env);
        match resolution {
            DisputeResolution::Refund => refund(&env, &mut booking),
            DisputeResolution::Release => release(&env, &mut booking)?,
            DisputeResolution::Split(renter_amount) => {
                if renter_amount < 0 || renter_amount > booking.deposit_amount {
                    return Err(ContractError::InvalidResolution);
                }
                let host_amount = booking
                    .deposit_amount
                    .checked_sub(renter_amount)
                    .ok_or(ContractError::InvalidResolution)?;
                if renter_amount > 0 {
                    transfer(
                        &env,
                        &env.current_contract_address(),
                        &booking.renter,
                        renter_amount,
                    );
                }
                if host_amount > 0 {
                    transfer(
                        &env,
                        &env.current_contract_address(),
                        &booking.host,
                        host_amount,
                    );
                }
                booking.state = BookingState::Released;
                write_booking(&env, &booking);
                DepositSplit {
                    booking_id,
                    renter_amount,
                    host_amount,
                }
                .publish(&env);
            }
        }
        Ok(())
    }

    pub fn refund_booking(
        env: Env,
        arbitrator: Address,
        booking_id: u64,
    ) -> Result<(), ContractError> {
        Self::resolve_dispute(env, arbitrator, booking_id, DisputeResolution::Refund)
    }

    pub fn expire_booking(env: Env, booking_id: u64) -> Result<(), ContractError> {
        let mut booking = read_booking(&env, booking_id)?;
        if env.ledger().timestamp() <= booking.confirmation_deadline {
            return Err(ContractError::InvalidBookingState);
        }
        match booking.state {
            BookingState::Created => {
                booking.state = BookingState::Expired;
                write_booking(&env, &booking);
            }
            BookingState::Funded | BookingState::CheckedIn => refund(&env, &mut booking),
            _ => return Err(ContractError::InvalidBookingState),
        }
        BookingExpired { booking_id }.publish(&env);
        Ok(())
    }

    pub fn pause(env: Env, admin: Address) -> Result<(), ContractError> {
        let mut cfg = config(&env)?;
        if cfg.admin != admin {
            return Err(ContractError::UnauthorizedAdmin);
        }
        admin.require_auth();
        cfg.paused = true;
        write_config(&env, &cfg);
        ContractPaused { admin }.publish(&env);
        Ok(())
    }

    pub fn unpause(env: Env, admin: Address) -> Result<(), ContractError> {
        let mut cfg = config(&env)?;
        if cfg.admin != admin {
            return Err(ContractError::UnauthorizedAdmin);
        }
        admin.require_auth();
        cfg.paused = false;
        write_config(&env, &cfg);
        ContractUnpaused { admin }.publish(&env);
        Ok(())
    }

    pub fn update_config(
        env: Env,
        admin: Address,
        new_config: EscrowConfig,
    ) -> Result<(), ContractError> {
        let cfg = config(&env)?;
        if cfg.admin != admin || new_config.admin != admin {
            return Err(ContractError::UnauthorizedAdmin);
        }
        validate_config(&new_config)?;
        admin.require_auth();
        write_config(&env, &new_config);
        Ok(())
    }

    pub fn upgrade_contract(
        env: Env,
        admin: Address,
        wasm_hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        let cfg = config(&env)?;
        if cfg.admin != admin {
            return Err(ContractError::UnauthorizedAdmin);
        }
        admin.require_auth();
        env.deployer().update_current_contract_wasm(wasm_hash);
        Ok(())
    }
}

mod test;
