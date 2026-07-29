# Contract guide

Build and verify with the Rust commands documented by the repository. Generate bindings after every contract interface change. Initialize exactly once with admin, accepted asset, deposit bounds and time windows.

The current optimized contract is deployed on Stellar Mainnet. Any replacement must be reviewed, built reproducibly and explicitly approved before deployment.

The deployed optimized Wasm is 7,427 bytes. Listings, QR tokens, raw evidence, notifications, feedback and analytics remain off-chain; authorization and one-settlement checks remain mandatory.
