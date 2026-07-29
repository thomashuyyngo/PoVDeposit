# Contract review

Internal review covers one-time initialization, participant/admin/arbitrator authorization, unique booking IDs, ordered deadlines, bounded deposits/fees, ledger-time decisions, one terminal settlement, checked arithmetic, TTL extension, pause and events.

Only settlement-critical state and hashes are on-chain to minimize Wasm/storage cost. Listings, images, QR tokens, feedback, notifications and raw evidence remain off-chain. This is not an external audit.
