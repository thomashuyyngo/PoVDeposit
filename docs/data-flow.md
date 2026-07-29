# Data flow

1. API reserves a slot and returns deterministic contract-call parameters.
2. Wallet signs on Mainnet.
3. Backend reads the transaction from Mainnet RPC and matches contract, event and booking.
4. A database transaction records status history and the unique hash.
5. QR issuance and evidence remain private off-chain; only proof/evidence hashes enter contract calls.
6. Contract settlement event updates the receipt and notification timeline.
