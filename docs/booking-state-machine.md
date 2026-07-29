# Booking state machine

Allowed states are Created, Funded, CancelledByRenter, CancelledByHost, CheckedIn, VisitConfirmed, RenterNoShow, HostNoShow, Disputed, Refunded, Released and Expired.

Only explicit contract methods advance state. Participant/role authorization, ledger-time windows and one-time settlement are enforced before mutation. Refunded, Released and Expired are terminal.
