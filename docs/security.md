# Security boundaries

- Initialization requires admin authorization and stores a designated arbitrator plus payment asset.
- A renter must authorize booking funding; the contract transfers the configured token into escrow before setting `Funded`.
- Only the booking host can record check-in or release a checked-in booking.
- Only the configured arbitrator can refund a funded or disputed booking.
- The Mainnet deployment uses native XLM for deposits and refunds.
- The web application connects wallet extensions, stores only the public address locally and requires Mainnet before a contract operation.

The backend accepts booking state changes only after a matching successful Mainnet contract event. See the [security audit](security/security-audit.md).
