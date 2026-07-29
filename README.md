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

The optimized Mainnet contract is 7,427 bytes and exposes only the six functions required by the booking lifecycle.

## Mainnet validation ledger

Eight Mainnet users completed the real contract lifecycle. Each deposit was returned by `cancel_booking`; the production activity view reads the verified PostgreSQL records and excludes unsigned booking intents.

| Wallet | Create | Fund | Refund |
|---:|---|---|---|
| 15 | [`a1db6708…ca83`](https://stellar.expert/explorer/public/tx/a1db67084d8d9936efad4f1b96f5ccc65bdd4937278d8f436d4008d3125fca83) | [`17180619…0369`](https://stellar.expert/explorer/public/tx/17180619acc34336ddb1050f27cd285ecabbb8599c0f6b8fc42e9819b79c0369) | [`0a1eade0…f0b2`](https://stellar.expert/explorer/public/tx/0a1eade0e85a0470058813cbc8e7087e1fe9abb05d66b61a2491ba37ed59f0b2) |
| 16 | [`efce4c2a…c4a4`](https://stellar.expert/explorer/public/tx/efce4c2acc910d5a1a98e6004585f48b4de0ed971aa0760ce36424746dcec4a4) | [`441db380…e045`](https://stellar.expert/explorer/public/tx/441db3804bbaec7d8bbaeb2d901c552e58ce7127b892431c52aee16b31ece045) | [`a28368ae…623a`](https://stellar.expert/explorer/public/tx/a28368ae483e97cbcf2cf7442c8d57870be780895a26a9da59fe87cd2302623a) |
| 17 | [`f2f3782d…b7ed`](https://stellar.expert/explorer/public/tx/f2f3782d4fba7fa56893ee484e4594d55309d13e8b6e93de7a3d9921ed51b7ed) | [`006f72ac…691e`](https://stellar.expert/explorer/public/tx/006f72ac329e0e6a222bd7ec2402ff98d4a1c0ae84e707e1b7d460a04305691e) | [`877b8873…7846`](https://stellar.expert/explorer/public/tx/877b88739a76368103d02387b4d26d15a67967eedd814826a203314652177846) |
| 18 | [`3a09f156…d419`](https://stellar.expert/explorer/public/tx/3a09f156aaf58eab4bd52a6ab8050856804bf56b5eebb9c11843e1ee6c7ed419) | [`2b0cf229…2add`](https://stellar.expert/explorer/public/tx/2b0cf2293dfcb31916cd64402f05340633fd7aa190d5d102873ba55372db2add) | [`831a57b2…0075`](https://stellar.expert/explorer/public/tx/831a57b2558d89c517e6b66665fc208f3383bb035788253ac1838c9d3ca20075) |
| 19 | [`3b8a4e7f…fef5`](https://stellar.expert/explorer/public/tx/3b8a4e7f15e11a17cd31731836b9a0f2a3e8611bbfda2c3ca70797ca40b3fef5) | [`a9bddb33…296d`](https://stellar.expert/explorer/public/tx/a9bddb3356ab1f485379fc78dd5a0a66ac511d77a6ab88ea1babe07fc33f296d) | [`e590d2d1…4cf2`](https://stellar.expert/explorer/public/tx/e590d2d11766274479c28a4ae47486694ed841fc2704b2aae288812d1c6a4cf2) |
| 20 | [`eb5c6175…01b5`](https://stellar.expert/explorer/public/tx/eb5c617575b8412c0c3dd8712732146fec6ff16d66435785fc1ab6f4ab8d01b5) | [`5f866c69…624a`](https://stellar.expert/explorer/public/tx/5f866c6932a47ac9c008ea519332ff99b69e29ebd1da5446842f9aa57234624a) | [`f1d1a906…2c87`](https://stellar.expert/explorer/public/tx/f1d1a906a4a334728cbb945321b2427ea3589cf261c3c2f7ce48d8edc4032c87) |
| 21 | [`1b07a6d4…4046`](https://stellar.expert/explorer/public/tx/1b07a6d4294c34012e92eab0b6e8359c68b09212029ac1336f3e8dddeb994046) | [`2d0a66f3…1ebb`](https://stellar.expert/explorer/public/tx/2d0a66f370c74522a383dbdc8a50ebeb709cbce2c16aa03819b3430b56791ebb) | [`3def5162…6675`](https://stellar.expert/explorer/public/tx/3def5162d39d06f362e18461d317020f9ab506d8858e1e4ee8f4c30b648e6675) |
| 22 | [`f67754a9…3fd1`](https://stellar.expert/explorer/public/tx/f67754a9bdf77bb8f08b6b1938b5e6a67f9e3359e6cb31538bacbfa5acc03fd1) | [`0095406a…e3d5`](https://stellar.expert/explorer/public/tx/0095406a12f79922d2b78768f4de3f941121f725ff222e49d59f869fdd2ae3d5) | [`811ca5fc…5997`](https://stellar.expert/explorer/public/tx/811ca5fcb4a91a128608a8b6a281a00899350a379b77479fa565450aa3005997) |

Wallet 18 also recovered a retry deposit in [`a03a9478…70ad`](https://stellar.expert/explorer/public/tx/a03a9478679a6f8ccb70a6277c3c83d99e0d21ce08ff7b5fb399d6a472f570ad). No funded booking remains.

This project covers users 15–22 of a 22-user Mainnet validation set; users 01–14 validated [AI API Toll Booth](https://github.com/trungdo128/AI-API-Toll-Booth).

## Level 6 evidence map

- Public repository: [thomashuyyngo/PoVDeposit](https://github.com/thomashuyyngo/PoVDeposit)
- Commit history: more than 30 meaningful commits
- Live Mainnet application: [Railway production](https://povdeposit-production.up.railway.app/)
- Mainnet contract: [`CBTP…2TJD`](https://stellar.expert/explorer/public/contract/CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD)
- Proof of Mainnet users: eight direct users here and the 22-user cross-project Mainnet set
- Transaction activity proof: verified create, fund and refund hashes in the Mainnet validation ledger
- Audit/security review proof: [full security audit report](docs/security/security-audit.md), [security policy](SECURITY.md) and [threat model](docs/security/threat-model.md)
- X launch post: [NgVnTundgfz/status/2082132043144806733](https://x.com/NgVnTundgfz/status/2082132043144806733)
- Demo video: [Google Drive walkthrough](https://drive.google.com/file/d/1oXwBFKk2INy1pXN5-qiUy1Zx6PGExppt/view?usp=sharing)
- Technical documentation: [architecture](docs/architecture.md), [contract guide](docs/contract-guide.md), [API reference](docs/api-reference.md)
- User documentation: [renter guide](docs/renter-guide.md), [host guide](docs/host-guide.md), [wallet guide](docs/wallet-guide.md)
- Community contribution: [reusable attendance-deposit pattern](docs/community-contribution.md)

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

## Screenshots

The production release includes responsive desktop and mobile property and booking screens. Submission screenshots come from the deployed Mainnet revision.

## Security, privacy and limitations

Wallet extensions handle signatures. The application stores public addresses only, rejects the wrong network, hashes one-time challenges, keeps evidence access-controlled and never uses GPS as the sole proof.

The published security material is an internal review, not an independent third-party audit. The cross-project Mainnet set contains 22 users, while this repository directly proves eight Mainnet users.

Start with the [renter guide](docs/renter-guide.md), [host guide](docs/host-guide.md), [wallet guide](docs/wallet-guide.md), [architecture](docs/architecture.md), [contract guide](docs/contract-guide.md) and [security model](docs/security/threat-model.md).
