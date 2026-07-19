# PoVDeposit

PoVDeposit is a Stellar Testnet escrow platform for rental-property viewing appointments. It records a booking deposit, QR check-in, attendance confirmation, refund/release outcomes, and eligible disputes.

## Status

The escrow contract is deployed and initialized on Stellar Testnet. Mainnet deployment, stablecoin integration, user evidence, external audits, and demo video are intentionally not claimed.

## Testnet deployment

- Escrow: [`CAGCIQAVH7TJ527LIZJU45VDRH6E4HA37ULNBNQZO3G65ZFCCRNWJ2U7`](https://lab.stellar.org/r/testnet/contract/CAGCIQAVH7TJ527LIZJU45VDRH6E4HA37ULNBNQZO3G65ZFCCRNWJ2U7)
- Deploy transaction: [`836cc43a…8c296d`](https://stellar.expert/explorer/testnet/tx/836cc43ad184a5f7de6d2b4f2b7f1daec4e70156ca24be55b4278ee7b58c296d)
- Initialize transaction: [`4a5eccfe…1b522e`](https://stellar.expert/explorer/testnet/tx/4a5eccfef4477ba49bfc6b504fc293d1922073abb4c3965c006ccb7e811b522e)
- Payment asset: native Testnet XLM asset contract, used only for deployment verification—not represented as a stablecoin.

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
