# PoVDeposit Implementation Plan

**Goal:** Build a Testnet-only property-viewing deposit platform with secure booking, QR check-in, refund/release, and dispute flows.

**Architecture:** pnpm monorepo with Next.js role-specific web application, NestJS booking API, PostgreSQL/Redis coordination, and a Soroban escrow state machine. Booking identifiers and payment hashes are public proof; evidence files and personal details remain protected off-chain.

## Global constraints

- Stellar Testnet only; no Mainnet deployment or claims.
- Freighter and Rabet are the only user-facing wallets.
- No wallet seed phrase, private key, location-sensitive evidence, or personal data is committed or logged.
- Every terminal booking settlement is mutually exclusive: refund, release, or dispute resolution.
- The five feedback commits are deferred until real external feedback exists.

## Delivery sequence

1. Bootstrap pnpm workspace, strict TypeScript, Rust tooling, CI, Docker dependencies, approval record, and baseline docs.
2. Implement the Soroban escrow state machine with authorization, booking IDs, deposit rules, cancellation, no-show, dispute, pause, and invariant tests.
3. Build shared contract types, wallet capability detection, Testnet signing flow, and event synchronization.
4. Build NestJS property, slot, booking, QR, evidence, notification, and dispute modules with database locking and OpenAPI.
5. Build secure QR challenge generation, replay prevention, manual fallback, and check-in confirmation flow.
6. Build renter, host, admin, and arbitrator web surfaces with accessible transaction states and responsive layouts.
7. Add booking receipt, timeline, contract history, security documentation, and threat-model mitigations.
8. Add contract/API/web tests, CI, Testnet deployment records, and only factual Testnet evidence.
