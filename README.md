# PoVDeposit

PoVDeposit is a Stellar Testnet escrow platform for rental-property viewing appointments. It records a booking deposit, QR check-in, attendance confirmation, refund/release outcomes, and eligible disputes.

## Status

The escrow contract is deployed and initialized on Stellar Testnet. Mainnet deployment, stablecoin integration, user evidence, external audits, and demo video are intentionally not claimed.

## Testnet deployment

- Escrow v2: [`CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF`](https://lab.stellar.org/r/testnet/contract/CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF)
- Deploy transaction: [`8b14ebe6…0a2165`](https://stellar.expert/explorer/testnet/tx/8b14ebe648b4fa2402c279ed6e8216afa8c358c9f45e5080e6b7327f050a2165)
- Initialize transaction: [`d66389ea…b9fb25`](https://stellar.expert/explorer/testnet/tx/d66389ea801252ca3ce9b3e92fe913e9d38329b3992ba33479e90754f6b9fb25)
- Payment asset: native Testnet XLM asset contract, used only for deployment verification—not represented as a stablecoin.
- On-chain booking evidence: booking `1` was created as `PendingFunding` ([transaction](https://stellar.expert/explorer/testnet/tx/1be8a021b27fd0d1130f00de0d2ffa2c512594b54cf6fad87b30a696665e893d)), funded with 1 native Testnet atomic unit ([transaction](https://stellar.expert/explorer/testnet/tx/9fc984b7bb9572ec1101d36e9eef796c1f1bbca9ed691a44689815d4f3330e93)), checked in ([transaction](https://stellar.expert/explorer/testnet/tx/df882931a7d37b0d30ca9002c88a4ea2c47bcc3f1e6d7e75a53435c7825de95a)), and released ([transaction](https://stellar.expert/explorer/testnet/tx/2900d7e4a8cfcd42bbe7233ab3ed24e8267db710869c67ba551dc7762b9a2ee1)). The final on-chain state is `Released`.
- Escrow v2 cancellation evidence: booking `1` was created ([transaction](https://stellar.expert/explorer/testnet/tx/746222b0c11e65cecb049440fb621315fadd7b8eeb1143a9d74b73ba938f1b93)) and cancelled before funding ([transaction](https://stellar.expert/explorer/testnet/tx/31074806e8a6c0dfc96984e431928a6b1f3efd702a242a8f33b6de1b4042bede)).

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
