# Contract guide

Build and test with the Rust commands in README. Generate bindings after every contract interface change. Initialize exactly once with admin, arbitrator, accepted asset, fee recipient, fee bound, deposit bounds and time windows.

Mainnet deployment is prohibited for this release. Before any later Mainnet action, compare optimized Wasm size, simulate resource fees and obtain explicit owner approval.

The current optimized Wasm is 20,188 bytes and a second Stellar CLI optimization pass produced no reduction. Keep listings, QR tokens, raw evidence, notifications, feedback and analytics off-chain; do not remove authorization or one-settlement checks to chase a smaller binary.
