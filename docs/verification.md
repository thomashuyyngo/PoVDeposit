# Verification record

Verified locally and on Stellar Testnet on 2026-07-29.

```powershell
pnpm test
Set-Location packages/contracts
cargo test
stellar contract build
```

The optimized release artifact is 20,188 bytes with SHA-256 `c223fe747c699ceaa2b819d83d6cf70f5a9c7a712cc6b52fee35853cdce81f65`. It is deployed as [`CAV2…G2JP`](https://lab.stellar.org/r/testnet/contract/CAV2VP3TEG76NZ2D5H2Z67YR6R4JTNU4RB2O7JCJARJEGJFWWXZUG2JP); exact deployment and lifecycle metadata is in [`deployments/testnet.json`](../deployments/testnet.json).
