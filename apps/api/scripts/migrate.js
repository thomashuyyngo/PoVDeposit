import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('RENTER', 'HOST', 'ARBITRATOR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS viewing_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id),
    starts_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'BOOKED', 'CANCELLED')) DEFAULT 'OPEN'
  );
  CREATE TABLE IF NOT EXISTS bookings (
    contract_booking_id BIGINT PRIMARY KEY,
    slot_id UUID REFERENCES viewing_slots(id),
    renter_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    host_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    deposit_atomic BIGINT NOT NULL CHECK (deposit_atomic > 0),
    state TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS booking_events (
    id BIGSERIAL PRIMARY KEY,
    contract_booking_id BIGINT NOT NULL REFERENCES bookings(contract_booking_id),
    event_type TEXT NOT NULL,
    transaction_hash TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_booking_id BIGINT NOT NULL REFERENCES bookings(contract_booking_id),
    opened_by_wallet TEXT NOT NULL REFERENCES users(wallet_address),
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'RESOLVED')) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`);

await pool.end();
console.log("D8 migration complete");
