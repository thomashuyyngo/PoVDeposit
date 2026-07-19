# Verification record

Verified locally on 2026-07-19.

```powershell
pnpm test
Set-Location packages/contracts
cargo test
stellar contract build
```

The current release build produced `pov_deposit_escrow.wasm` (7,456 bytes) with SHA-256 `01e9649cb8221d87bf1b61660962ff6804ee78c2bba541ba8912599c07ac0346`.

This is a local build record, not a Testnet deployment claim.
