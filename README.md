# PoVDeposit

PoVDeposit is a Stellar Testnet escrow platform for rental-property viewing appointments. It records a booking deposit, QR check-in, attendance confirmation, refund/release outcomes, and eligible disputes.

## Status

Implementation has started on the `development` branch. Mainnet deployment, Mainnet claims, user evidence, external audits, and demo video are intentionally not claimed.

## Workspace

- `apps/web` — renter, host, admin, and arbitrator experiences
- `apps/api` — booking, evidence, notification, QR, and contract-sync API
- `packages/contracts` — Soroban visit-deposit escrow
- `packages/stellar` — wallet and contract utilities
- `docs` — product, security, deployment, and evidence records

## Local checks

```powershell
pnpm test
Set-Location packages/contracts
cargo test
```

Open `apps/web/index.html` for the current rental-escrow demo. Contract tests cover token funding, host release, and arbitrator refund using the local Soroban host; deployment and wallet integration are not claimed until they are configured and verified on Testnet.
