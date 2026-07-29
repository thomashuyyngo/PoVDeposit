# Proof-of-Visit Deposit

Proof-of-Visit Deposit is a property-viewing escrow on Stellar Testnet. A renter reserves an approved viewing slot, sees the attendance rule before signing, funds a Soroban escrow, checks in with a short-lived QR challenge and receives the contract-defined refund, release or dispute outcome.

## What it solves

Rental viewings frequently fail because a listing is untrustworthy, one party does not attend, deposits are requested without clear rules, or there is no shared evidence. This product makes the amount, deadlines, no-show outcome and dispute path visible before funds move.

## Why Stellar

Soroban enforces booking state and one-time settlement while Stellar provides low-cost Testnet transactions and public explorer evidence. Only evidence hashes and public wallet addresses belong on-chain; personal details and precise locations do not.

This release is Testnet-only. Native Testnet XLM is used for engineering verification and is not represented as a stablecoin.

## Roles

- Renter: browse approved listings, choose a slot, review Template A, fund, check in, confirm, cancel or dispute.
- Host/agent: apply, manage listings and slots, confirm attendance, report a no-show and answer disputes.
- Admin/arbitrator: moderate listings and resolve eligible disputes without arbitrary access to escrow funds.

## Attendance-deposit rule

Template A is the MVP rule. An attended and confirmed visit refunds the renter. An eligible renter no-show may release the deposit to the host minus the disclosed bounded fee. A host no-show refunds the renter. An eligible dispute pauses settlement until the configured arbitrator resolves it.

`Created → Funded → CheckedIn → VisitConfirmed → Refunded`

Alternative terminal paths are cancellation, renter/host no-show, dispute resolution, release and expiry. A booking settles at most once.

## System design

- `apps/web`: Next.js static export with property search, booking review, renter/host/admin views, Freighter and Rabet modal, responsive modes and a lazy React Three Fiber building scene.
- `apps/api`: NestJS, Prisma and PostgreSQL for wallet sessions, approved properties, slots, booking records, QR challenges, disputes, audit logs and contract reconciliation.
- `packages/contracts`: Rust `VisitDepositEscrow` Soroban contract.
- `packages/stellar`: generated TypeScript bindings.

The browser is never authoritative for funding or settlement. The backend accepts a state change only after a successful Testnet transaction containing the matching contract event.

## Public Testnet environment

- Application: [povdeposit-production.up.railway.app](https://povdeposit-production.up.railway.app/)
- Health: [ `/health` ](https://povdeposit-production.up.railway.app/health)
- Current Testnet escrow: [`CAV2…G2JP`](https://lab.stellar.org/r/testnet/contract/CAV2VP3TEG76NZ2D5H2Z67YR6R4JTNU4RB2O7JCJARJEGJFWWXZUG2JP)
- Wasm/deployment transactions: [`ed432196…c833`](https://stellar.expert/explorer/testnet/tx/ed432196bd0257a618d491259e262004700bf93c3459dbaeb8153efa7dc1c833), [`d60c2338…31bc`](https://stellar.expert/explorer/testnet/tx/d60c2338cb30d1e1a9854c4fbd10d2c0f887a265666d47272374ab6a47a231bc)
- Initialization transaction: [`894717a6…9ada`](https://stellar.expert/explorer/testnet/tx/894717a657e99d0e5131b5f48888f6141287db8b415d1c3557cc975ea3189ada)
- Attended/refund settlement: [`bb90a7da…c575`](https://stellar.expert/explorer/testnet/tx/bb90a7da978e3c3baee26ae72821ba21c2b747732cc945c0b7fec76a8d65c575)
- Dispute/release settlement: [`c85d0bef…4790`](https://stellar.expert/explorer/testnet/tx/c85d0bef690a26c6612edc93c8c862ab127b158249cd8f902725bb043d154790)

Current-source controlled Testnet lifecycles reached final `Refunded` and `Released` states with the expected asset-transfer events. Full artifact, role and transaction metadata is recorded in [`deployments/testnet.json`](deployments/testnet.json).

## Run locally

Requirements: Node.js 22, pnpm 10.18.3, Rust stable, `wasm32v1-none`, PostgreSQL and Stellar CLI.

```powershell
corepack pnpm install
Copy-Item apps/api/.env.example apps/api/.env
corepack pnpm --filter @pov-deposit/api exec prisma generate
corepack pnpm --filter @pov-deposit/api migrate
corepack pnpm --filter @pov-deposit/api seed
corepack pnpm build
corepack pnpm start
```

Set the documented API variables, including `DATABASE_URL`, `PUBLIC_ORIGIN`, strong session/check-in secrets, Testnet RPC/Horizon URLs, accepted asset and the current escrow contract. Never commit `.env`, private keys or seed phrases.

## Quality commands

```powershell
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm --filter @pov-deposit/web exec playwright test
cargo fmt --manifest-path packages/contracts/Cargo.toml --check
cargo clippy --manifest-path packages/contracts/Cargo.toml -- -D warnings
cargo test --manifest-path packages/contracts/Cargo.toml
cargo build --manifest-path packages/contracts/Cargo.toml --target wasm32v1-none --release
```

## Screenshots

Desktop/mobile property and booking screens are captured by Playwright. Submission screenshots must come from the final deployed commit; generated test artifacts are not committed.

## Security, privacy and limitations

Wallet extensions handle signatures. The application stores public addresses only, rejects the wrong network, hashes one-time challenges, keeps evidence access-controlled and never uses GPS as the sole proof.

Full contract-event reconciliation across every production controller, current Freighter and Rabet extension smoke tests, 20 consented user flows, an authorized X post and any external audit are still pending. Exact 30 commits cannot be claimed because existing meaningful history already exceeds 30 and has not been rewritten.

Start with the [renter guide](docs/renter-guide.md), [host guide](docs/host-guide.md), [wallet guide](docs/wallet-guide.md), [security model](docs/security/threat-model.md), [Testnet deployment](docs/deployment/testnet.md) and [submission status](SUBMISSION_STATUS.md).
