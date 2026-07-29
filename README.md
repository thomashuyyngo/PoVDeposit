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
- Historical verified escrow: [`CBO2…I7LF`](https://lab.stellar.org/r/testnet/contract/CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF)
- Historical deploy transaction: [`8b14ebe6…a2165`](https://stellar.expert/explorer/testnet/tx/8b14ebe648b4fa2402c279ed6e8216afa8c358c9f45e5080e6b7327f050a2165)
- Historical initialize transaction: [`d66389ea…9fb25`](https://stellar.expert/explorer/testnet/tx/d66389ea801252ca3ce9b3e92fe913e9d38329b3992ba33479e90754f6b9fb25)

The current contract source and optimized Wasm are newer than this historical deployment. Redeploying the current Wasm and recording fresh Freighter/Rabet flows remain required before the current revision is submission-ready.

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

Current-source deployment, durable booking/check-in persistence, full contract reconciliation, current Freighter and Rabet smoke tests, 20 consented user flows, an authorized X post and any external audit are still pending. Exact 30 commits cannot be claimed because existing meaningful history already exceeds 30 and has not been rewritten.

Start with the [renter guide](docs/renter-guide.md), [host guide](docs/host-guide.md), [wallet guide](docs/wallet-guide.md), [security model](docs/security/threat-model.md), [Testnet deployment](docs/deployment/testnet.md) and [submission status](SUBMISSION_STATUS.md).
