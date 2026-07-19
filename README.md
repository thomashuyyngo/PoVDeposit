# PoVDeposit

PoVDeposit is a Stellar Testnet escrow platform for rental-property viewing appointments. It records a booking deposit, QR check-in, attendance confirmation, refund/release outcomes, and eligible disputes.

## Status

The escrow contract is deployed and initialized on Stellar Testnet. Mainnet deployment, stablecoin integration, user evidence, external audits, and demo video are intentionally not claimed.

## Railway deployment

Railway successfully deployed the current `development` revision on 2026-07-19. The service runs `pnpm migrate && pnpm seed && pnpm start`, exposes `/health`, and uses Neon PostgreSQL. [Railway deployment dashboard](https://railway.com/project/dd24d801-4711-41e0-8c76-80bbd2baab73?environmentId=305f77b9-6e4e-405d-b94a-1fb06b04bdb6)

## Testnet deployment

- Escrow v2: [`CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF`](https://lab.stellar.org/r/testnet/contract/CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF)
- Deploy transaction: [`8b14ebe6…0a2165`](https://stellar.expert/explorer/testnet/tx/8b14ebe648b4fa2402c279ed6e8216afa8c358c9f45e5080e6b7327f050a2165)
- Initialize transaction: [`d66389ea…b9fb25`](https://stellar.expert/explorer/testnet/tx/d66389ea801252ca3ce9b3e92fe913e9d38329b3992ba33479e90754f6b9fb25)
- Payment asset: native Testnet XLM asset contract, used only for deployment verification—not represented as a stablecoin.
- On-chain booking evidence: booking `1` was created as `PendingFunding` ([transaction](https://stellar.expert/explorer/testnet/tx/1be8a021b27fd0d1130f00de0d2ffa2c512594b54cf6fad87b30a696665e893d)), funded with 1 native Testnet atomic unit ([transaction](https://stellar.expert/explorer/testnet/tx/9fc984b7bb9572ec1101d36e9eef796c1f1bbca9ed691a44689815d4f3330e93)), checked in ([transaction](https://stellar.expert/explorer/testnet/tx/df882931a7d37b0d30ca9002c88a4ea2c47bcc3f1e6d7e75a53435c7825de95a)), and released ([transaction](https://stellar.expert/explorer/testnet/tx/2900d7e4a8cfcd42bbe7233ab3ed24e8267db710869c67ba551dc7762b9a2ee1)). The final on-chain state is `Released`.
- Escrow v2 cancellation evidence: booking `1` was created ([transaction](https://stellar.expert/explorer/testnet/tx/746222b0c11e65cecb049440fb621315fadd7b8eeb1143a9d74b73ba938f1b93)) and cancelled before funding ([transaction](https://stellar.expert/explorer/testnet/tx/31074806e8a6c0dfc96984e431928a6b1f3efd702a242a8f33b6de1b4042bede)).
- Current v2 wallet smoke test: a controlled renter/host pair completed booking `2` through `PendingFunding → Funded → CheckedIn → Released`; [wallet smoke evidence](docs/testnet-wallet-smoke.md).
- The same controlled Testnet setup also completed booking `3` through `PendingFunding → Funded → Disputed → Refunded`; [wallet smoke evidence](docs/testnet-wallet-smoke.md).

## Workspace

- `apps/web` — renter, host, admin, and arbitrator experiences
- `apps/api` — booking-intent and health API
- `packages/contracts` — Soroban visit-deposit escrow
- `docs` — security boundaries and verification records

## Local checks

```powershell
pnpm test
Set-Location packages/contracts
cargo test
```

Open `apps/web/index.html` for the current rental-escrow demo. `POST /api/bookings` persists a pending-funding off-chain intent with its own UUID; it does not claim to create an on-chain booking. Contract tests cover token funding, host release, and arbitrator refund using the local Soroban host; deployment and wallet integration are not claimed until they are configured and verified on Testnet.

## Service configuration

Set `DATABASE_URL` to the managed PostgreSQL connection string. `PORT` is optional and defaults to `3000`. Do not commit database credentials, wallet secrets, or Testnet key material.

See [security boundaries](docs/security.md) and the [verification record](docs/verification.md) for the tested scope and known production gaps.
