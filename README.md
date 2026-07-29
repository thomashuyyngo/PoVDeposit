# Proof-of-Visit Deposit

Proof-of-Visit Deposit is a property-viewing escrow on Stellar Mainnet. A renter reserves an approved viewing slot, signs the booking in Freighter, funds the Soroban escrow and receives the deposit back after host confirmation or a pre-visit cancellation.

## What it solves

Rental viewings frequently fail because a listing is untrustworthy, one party does not attend, deposits are requested without clear rules, or there is no shared evidence. This product makes the amount, deadlines, no-show outcome and dispute path visible before funds move.

## Why Stellar

Soroban enforces booking state and one-time settlement while Stellar provides public transaction evidence. Only booking identifiers, public wallet addresses, amount and visit time belong on-chain; personal details and precise locations do not.

The live release uses native Mainnet XLM. Users must review the real amount and destination in Freighter before signing.

## Roles

- Renter: browse approved listings, choose a slot, create and fund a booking, or cancel before the visit for an on-chain refund.
- Host/agent: manage listings and confirm that a funded visit occurred.
- Admin: moderate off-chain listing content; the deployed contract has no privileged withdrawal path.

## Attendance-deposit rule

The MVP rule is intentionally small: cancellation before the visit refunds the renter, while host confirmation at or after the visit also returns the full deposit to the renter.

`Created → Funded → Refunded/Released`

A booking settles at most once. Disputes and no-show penalties remain off-chain until an independently reviewed contract upgrade is justified.

## System design

- `apps/web`: Next.js static export with property search, booking review, renter/host/admin views, Freighter and Rabet modal, responsive modes and a lazy React Three Fiber building scene.
- `apps/api`: NestJS, Prisma and PostgreSQL for wallet sessions, approved properties, slots, booking records, QR challenges, disputes, audit logs and contract reconciliation.
- `packages/contracts`: Rust `VisitDepositEscrow` Soroban contract.
- `packages/stellar`: generated TypeScript bindings.

The browser is never authoritative for funding or settlement. The backend accepts a state change only after a successful Mainnet transaction containing the matching contract event.

## Live Mainnet deployment

- Application: [povdeposit-production.up.railway.app](https://povdeposit-production.up.railway.app/)
- Health: [ `/health` ](https://povdeposit-production.up.railway.app/health)
- Escrow contract: [`CBTP…2TJD`](https://stellar.expert/explorer/public/contract/CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD)
- Wasm upload: [`4ff47a3e…6a26`](https://stellar.expert/explorer/public/tx/4ff47a3e543f3bbae1b3bb98fb263745ecf81c796b1e1a2448aaa29bdc476a26)
- Contract deployment: [`e07e4779…b65e`](https://stellar.expert/explorer/public/tx/e07e47792aaf9f32fae8f9464261ddc585241e4b8f7f32609ddc091a05cbb65e)
- Initialization: [`4865fbab…0541`](https://stellar.expert/explorer/public/tx/4865fbab89b997e0a0bbee39c6d615147b8ea4abb0f3bc1c72e3e661ea7d0541)

The optimized contract is 7,427 bytes and exposes only six required functions. A current-source Testnet create/fund/cancel cycle transferred and refunded 0.1 XLM before the same artifact was deployed to Mainnet.

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

Set the documented API variables, including `DATABASE_URL`, `PUBLIC_ORIGIN`, strong session secrets, Mainnet RPC/Horizon URLs and the current escrow contract. Never commit `.env`, private keys or seed phrases.

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

Current Freighter extension smoke evidence, 20 consented Mainnet user flows, an authorized X launch post and an external audit remain pending. Existing meaningful history exceeds 30 commits and has not been rewritten.

Start with the [renter guide](docs/renter-guide.md), [host guide](docs/host-guide.md), [wallet guide](docs/wallet-guide.md), [security model](docs/security/threat-model.md), [Testnet deployment](docs/deployment/testnet.md) and [submission status](SUBMISSION_STATUS.md).
