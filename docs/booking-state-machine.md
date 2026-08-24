# Booking state machine

## The path a deposit takes

```
PENDING_FUNDING ──fund──> FUNDED ──check-in──> CHECKED_IN ──confirm──> COMPLETED
                             │
                             └──cancel──> REFUNDED
```

| Step | Who | What must be true |
| --- | --- | --- |
| `fund` | renter | a `booking_funded` event for this on-chain booking |
| `check-in` | renter | an unspent challenge the host issued in the last two minutes |
| `confirm` | host | state is `CHECKED_IN` and a `visit_confirmed` event exists |
| `cancel` | renter | state is `FUNDED` and a `deposit_refunded` event exists |

`COMPLETED` and `REFUNDED` are terminal. Role, state and one-time settlement are
checked before any row is written, and the contract stays the authority on every
step that moves money.

## Why check-in has no contract call

The escrow contract exposes `create_booking`, `fund_booking`, `cancel_booking` and
`confirm_visit`, and emits an event for each. It has no check-in method, because
check-in moves no funds.

Presence is proved off-chain instead: the host issues a signed, single-use
challenge at the property and the renter returns it within two minutes. The
recorded `checkInProofHash` is the hash of that spent nonce, so it stands for
someone having been there rather than for someone having pressed a button.

An earlier build required a `renter_checked_in` contract event at this step. The
contract never emitted one, so check-in always failed and `confirm` — which
requires `CHECKED_IN` — could never release a deposit to the host.
