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
