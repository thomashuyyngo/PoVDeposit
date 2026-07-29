# Threat model

| Threat | Primary control | Residual risk |
| --- | --- | --- |
| Double refund/release | Strict contract transitions and one terminal settlement | Contract defect |
| Unauthorized settlement | `require_auth` and role-bound methods | Compromised role key |
| Admin/arbitrator abuse | No arbitrary escrow withdrawal, bounded actions, audit log; multisig before Mainnet | Testnet single-key operation |
| Initialization/upgrade attack | One-time initialization and admin-authorized Wasm upgrade | Upgrade-key compromise |
| Booking collision/manipulation | Unique u64 on-chain ID, database uniqueness, visible amount/deadlines | Integration mismatch |
| Fake/replayed check-in | Server nonce, booking/renter binding, short expiry, one-time consume | Shared live code inside expiry |
| GPS spoofing | GPS optional and never sole evidence | Coarse location uncertainty |
| Evidence tampering/leak | SHA-256, access control, retention and no raw evidence on-chain | Storage/operator compromise |
| Signature replay/wrong network | Origin/network/nonce/expiry binding and Testnet recheck | Stolen short-lived session |
| Frontend/backend divergence | Successful matching contract event required before state update | RPC/indexer delay |
| Slot race | Unique slot booking plus transactional lock | Database outage |
| File/dependency/secret attack | Type/size allowlist, malware scan where configured, lockfiles, audit and gitleaks | Zero-day |

Trust boundaries are wallet extensions, browser, API, PostgreSQL, evidence storage, Stellar RPC, Soroban contract and notification provider. Precise location and raw personal evidence stay off-chain.
