# Testnet wallet smoke test

Performed on 2026-07-19 using controlled Stellar CLI Testnet identities. This is controlled QA evidence, not Mainnet-user evidence.

- Escrow: `CBO2L3OPLXQLKGNDV63VO3YDGL3KADSB4OOC3TQHT6ZP4SUNUP2KI7LF`
- Renter wallet: `GC5QVGZXRTZJZLGXON7PAMYNKQUQDB6VVGBOH7VDHOD3PNDE7S3ER3HQ`
- Host wallet: `GA6S6JMZEUJI6SWDJJG4KKLYXVHRFHXFJWTIY6MG57G7UEL2YN3N2TME`
- Booking `2` created: [`d98184cc…d4d0c`](https://stellar.expert/explorer/testnet/tx/d98184cc2bdf02660dbeefb6e86c2eca7a52239e2af9f78110e3f9845c6d4d0c)
- Deposit funded: [`cc7cf710…0bb6d`](https://stellar.expert/explorer/testnet/tx/cc7cf710e95950d3e12896eda8872701e232a2c5e342851e5df2f492b890bb6d)
- Host check-in: [`3048db18…82f6b`](https://stellar.expert/explorer/testnet/tx/3048db182ae57860961c3fbab0a0e1f3730b03f81c6a5acf27542b2227182f6b)
- Host release: [`ccb32ab0…dfe9a`](https://stellar.expert/explorer/testnet/tx/ccb32ab0ff9b5a1ccbec0a304ec113ee143c4a8f965f7d4775af8db2a75dfe9a)

The Testnet RPC readback after release returned booking state `Released`.

## Dispute and refund

The same controlled renter created booking `3` with the same host, then completed the dispute path with the configured arbitrator.

- Booking created: [`90ae5197…f50dc`](https://stellar.expert/explorer/testnet/tx/90ae51973e5289ff7cf1caef5a5c9af46cf918decd9c820e93eb3852185f50dc)
- Deposit funded: [`d428938e…8947d`](https://stellar.expert/explorer/testnet/tx/d428938e05090a7b6cb98772d61b7d9eb922ebdd2f2707777e83fcfa49f8947d)
- Renter opened dispute: [`eea699f6…b9fb`](https://stellar.expert/explorer/testnet/tx/eea699f60e53e15173240fccce547e66724f45c9c00cfe9c9284900ef8f9b9fb)
- Configured arbitrator refunded: [`66c88549…e1872`](https://stellar.expert/explorer/testnet/tx/66c88549a085699b4590ec76b57cecc989b05b43e9a457aae1b09e434d4e1872)

The Testnet RPC readback after settlement returned booking state `Refunded`.
