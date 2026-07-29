# Testnet wallet smoke test

Performed on 2026-07-29 using controlled Stellar CLI Testnet identities. This is controlled QA evidence, not Mainnet-user or browser-extension evidence.

- Current escrow: [`CAV2…G2JP`](https://lab.stellar.org/r/testnet/contract/CAV2VP3TEG76NZ2D5H2Z67YR6R4JTNU4RB2O7JCJARJEGJFWWXZUG2JP)
- Renter: `GDVZV6CYHCXLGEEW6OLNCBPTSE7NIBSF7YBRM4UTX7YHO4SZG4B7B6B7`
- Host: `GCT6YVSCRBAISRVZQVEWSMKTS6RGG3JAZHJVZZKN6TQML6JZGAS2ZTQE`
- Booking `1785298168` created: [`57077b82…643b`](https://stellar.expert/explorer/testnet/tx/57077b8246215fa9ac37f20c95ab5edf6808e99b28e502e3a29d7490df76643b)
- Deposit funded: [`c78dba2e…a736`](https://stellar.expert/explorer/testnet/tx/c78dba2e7d040a413199cf12607fefe8815335fad1b66a68f72a601d35d7a736)
- Renter check-in: [`bf5da81d…9d7b`](https://stellar.expert/explorer/testnet/tx/bf5da81d046972df90e159d6734de01697d261be10f1a42f0c7fc95e6a729d7b)
- Host confirmation and refund: [`bb90a7da…c575`](https://stellar.expert/explorer/testnet/tx/bb90a7da978e3c3baee26ae72821ba21c2b747732cc945c0b7fec76a8d65c575)

RPC readback returned final state `Refunded`; the asset event returned all `1,000,000` stroops to the renter.

## Dispute and refund

The same controlled renter created booking `1785298249`, funded it and opened a dispute. The host responded and the configured arbitrator selected `Release`.

- Booking created: [`f414e07e…467c`](https://stellar.expert/explorer/testnet/tx/f414e07e42004c6b70a3cb0dba92b186941c64888b82aefb7da05eb68d21467c)
- Deposit funded: [`e3e8653f…c10c`](https://stellar.expert/explorer/testnet/tx/e3e8653fd98e276a314b8a11c568834b65ce40746f212be7d9ca1471f4d1c10c)
- Renter opened dispute: [`1f82111f…7bf8`](https://stellar.expert/explorer/testnet/tx/1f82111fa490cd36644da6d4bbd092f3ff1b3bac165881b47f9f5dce29f17bf8)
- Host responded: [`98074965…4e67`](https://stellar.expert/explorer/testnet/tx/9807496556d42dc54fdbaa84a9b11a2accb08a2e55ce652d5c2107c122404e67)
- Arbitrator released: [`c85d0bef…4790`](https://stellar.expert/explorer/testnet/tx/c85d0bef690a26c6612edc93c8c862ab127b158249cd8f902725bb043d154790)

RPC readback returned final state `Released`; asset events paid `990,000` stroops to the host and the bounded 1% fee (`10,000` stroops) to the configured fee recipient.
