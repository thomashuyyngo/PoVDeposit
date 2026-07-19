import test from "node:test";
import assert from "node:assert/strict";
import { connectWallet } from "./wallet.js";

test("connects Rabet after the extension returns a public key", async () => {
  const wallet = await connectWallet("rabet", { rabet: { connect: async () => ({ publicKey: "GRABET" }) } });
  assert.deepEqual(wallet, { kind: "rabet", address: "GRABET", signing: "sign", network: "TESTNET_REQUESTED" });
});

test("uses the official Freighter SDK when it is available", async () => {
  const wallet = await connectWallet("freighter", {
    __freighterSdk: {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: "GFREIGHTER" }),
      getNetwork: async () => ({ network: "TESTNET" }),
    },
  });
  assert.equal(wallet.address, "GFREIGHTER");
});
