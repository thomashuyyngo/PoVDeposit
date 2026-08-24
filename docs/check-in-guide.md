# Check-in guide

## At the property

1. The host opens the booking on the check-in or attendance page and presses
   **Show the check-in code**. The API issues a signed challenge bound to the
   booking, the renter and a fresh nonce, valid for two minutes.
2. The renter enters that code and presses **Record check-in**. The API consumes
   the challenge exactly once and moves the booking to `CHECKED_IN`.
3. The host can then confirm the visit, which releases the deposit through the
   contract.

The short window is what the proof rests on: a code that only lives for two
minutes has to be read from the host's screen at the property.

## What the code contains

The token carries a version, the booking id, the renter address, the nonce and an
expiry, signed with `CHECKIN_TOKEN_SECRET`. No address, floor plan or owner
detail beyond the booking's own renter is inside it.

A token is rejected when it is altered, signed with a different key, issued for
another booking or renter, past its expiry, or already spent. Spending is settled
inside a database transaction, so two submissions of the same code cannot both
win.

Displaying it as a QR is a convenience. The same string typed by hand works
identically, which is the camera-free path.

## Operating notes

Set `CHECKIN_TOKEN_SECRET` in any deployment you care about. Left unset, the
service generates a random key at startup, so every restart invalidates the
challenges that were still outstanding.
