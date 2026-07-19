# Security boundaries

- Initialization requires admin authorization and stores a designated arbitrator plus payment asset.
- A renter must authorize booking funding; the contract transfers the configured token into escrow before setting `Funded`.
- Only the booking host can record check-in or release a checked-in booking.
- Only the configured arbitrator can refund a funded or disputed booking.
- The Testnet deployment uses native XLM for contract verification and is not a stablecoin deployment.

Before production use, add wallet-extension signing, QR nonce verification, evidence storage with retention controls, rate limits, and an independent contract review.
