# API reference

OpenAPI is exposed at `/docs`. Funding, cancellation and confirmation never
accept browser state as proof: each one requires a matching successful contract
event on the configured network.

## Health and configuration

| Route | Returns |
| --- | --- |
| `GET /health` | `{ status, service, network }` |
| `GET /api/stellar-config` | `{ network, networkPassphrase, rpcUrl, horizonUrl, contractId }` |

The configuration route always describes one coherent network. Passphrase,
Horizon and Soroban RPC follow `STELLAR_NETWORK` together, so the browser can
never be told it is on Mainnet while being handed testnet endpoints.

## Properties

| Route | Returns |
| --- | --- |
| `GET /api/properties` | Active listings with their unbooked future slots |
| `GET /api/properties/:slug` | One listing, or 404 |

## Booking lifecycle

`PENDING_FUNDING → FUNDED → CHECKED_IN → COMPLETED`, with `cancel` refunding a
funded booking instead.

| Route | Body | Contract event required |
| --- | --- | --- |
| `POST /api/bookings` | listing, renter, host, depositAmount, visitTime, evidenceHash | — |
| `GET /api/bookings/:id` | — | — |
| `POST /api/bookings/:id/fund` | `{ transactionHash }` | `booking_funded` |
| `POST /api/bookings/:id/check-in-challenge` | `{ actor }` — host only | — |
| `POST /api/bookings/:id/check-in` | `{ actor, token }` — renter only | — |
| `POST /api/bookings/:id/confirm` | `{ actor, transactionHash }` — host only | `visit_confirmed` |
| `POST /api/bookings/:id/cancel` | `{ actor, transactionHash }` | `deposit_refunded` |

Check-in is the one step the escrow contract has no call for, because it moves no
funds. Presence is proved instead by the challenge: the host issues it at the
property, the renter returns it within two minutes, and the API consumes it
exactly once. The stored `checkInProofHash` is the hash of that spent nonce.

`depositAmount` is a stroop string, and every booking response reports the
`network` it belongs to.

## Wallet authentication

`POST /api/auth/challenge` with `{ address }` returns a message to sign. Return it
to `POST /api/auth/verify` as `{ challengeId, address, signature }` with the
signature base64-encoded. Both calls require an `Origin` header listed in
`PUBLIC_ORIGIN`.
