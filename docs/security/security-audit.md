# Proof-of-Visit Deposit — Security Audit

## Review identity

- Date: 2026-07-29
- Review: internal security audit
- Branch: `development`
- Revision: `3f3356a`
- Network: Stellar Mainnet
- Escrow contract: [`CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD`](https://stellar.expert/explorer/public/contract/CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD)

## Reviewed surfaces

1. Soroban booking creation, funding, cancellation, confirmation and one-time settlement.
2. Renter and host authorization, unique booking identifiers and deadline enforcement.
3. Wallet challenge binding, Mainnet enforcement and contract-event verification.
4. PostgreSQL booking state, transaction uniqueness and production activity queries.
5. Browser security, sensitive property data exposure, dependencies and deployment secrets.

## Review procedure

The contract and application flows were manually traced across their trust boundaries. Automated verification covered Rust formatting and linting, contract behavior, optimized Wasm compilation, API behavior, strict TypeScript, production builds, browser flows, dependency vulnerabilities and committed-secret detection. Mainnet behavior was independently reconciled against public Stellar transaction records.

## Results

| Control | Evidence | Status |
|---|---|---|
| One-time initialization | Repeated initialization is rejected | Pass |
| Participant authorization | Settlement methods require the appropriate signer | Pass |
| Booking uniqueness | Contract and database enforce unique identifiers | Pass |
| Deposit bounds | Invalid amounts and deadline order are rejected | Pass |
| Single settlement | A funded booking can reach only one terminal outcome | Pass |
| Refund integrity | Cancellation returns the deposit to the renter | Pass |
| Event reconciliation | Database state changes require a matching successful Mainnet event | Pass |
| Network enforcement | Production signing and verification use Stellar Mainnet | Pass |
| Data minimization | Personal details and precise locations remain off-chain | Pass |
| Secret protection | Keys and environment credentials are excluded from source control | Pass |

## Findings and disposition

| Reference | Risk | Observation | Disposition |
|---|---|---|---|
| PVD-01 | Medium | Unsigned booking intents could appear in recent activity | Resolved: activity now requires at least one verified transaction |
| PVD-02 | Low | Role-key compromise could authorize an unintended settlement | Operational mitigation: separate custody and multisignature control |
| PVD-03 | Low | RPC delay can make a completed operation temporarily appear unfinished | Reconciliation is idempotent and public hashes remain authoritative |
| PVD-04 | Informational | Exact property coordinates would create unnecessary privacy exposure | Precise locations remain off-chain and outside public responses |

No unresolved critical or high-severity finding was identified.

## Mainnet verification

The README links thirteen Mainnet wallet accounts through create, fund and refund transactions. All verified deposits reached `REFUNDED`; no funded booking remains.

- Wasm upload: [`4ff47a3e…6a26`](https://stellar.expert/explorer/public/tx/4ff47a3e543f3bbae1b3bb98fb263745ecf81c796b1e1a2448aaa29bdc476a26)
- Contract deployment: [`e07e4779…b65e`](https://stellar.expert/explorer/public/tx/e07e47792aaf9f32fae8f9464261ddc585241e4b8f7f32609ddc091a05cbb65e)
- Initialization: [`4865fbab…0541`](https://stellar.expert/explorer/public/tx/4865fbab89b997e0a0bbee39c6d615147b8ea4abb0f3bc1c72e3e661ea7d0541)
- CI record: [GitHub Actions verification](https://github.com/thomashuyyngo/PoVDeposit/actions)

## Audit conclusion

The reviewed Mainnet release is suitable for its documented booking and refund scope. This is an internal point-in-time audit; it is not an independent firm certification.
