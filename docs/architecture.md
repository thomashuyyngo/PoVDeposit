# Architecture

`Next.js → NestJS/Prisma → PostgreSQL`

`Wallet → signed Soroban transaction → Stellar Testnet RPC → event verifier → database state`

The contract stores config, booking participants, amount, deadlines, state and evidence hashes. The API owns listings, slots, authentication, QR/evidence access, notifications, feedback and reconciliation cursors.
