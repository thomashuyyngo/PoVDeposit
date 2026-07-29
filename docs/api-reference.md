# API reference

OpenAPI is exposed at `/docs` by the backend. Core routes currently include health, wallet challenge/verification, public properties and booking lifecycle endpoints.

The generated OpenAPI document is authoritative for request schemas. Funding/check-in/confirmation endpoints must never accept browser state as proof; they require matching successful Testnet events.
