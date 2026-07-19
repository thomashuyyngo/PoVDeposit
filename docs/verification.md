# Verification record

Verified locally on 2026-07-19.

```powershell
pnpm test
Set-Location packages/contracts
cargo test
stellar contract build
```

The release build produced `pov_deposit_escrow.wasm` (7,096 bytes) with SHA-256 `3efe5838b4274253f0856baa0be38da2e63da8a94437e3af73309e9832565fbf`.

This is a local build record, not a Testnet deployment claim.
