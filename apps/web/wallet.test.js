import test from "node:test";
import assert from "node:assert/strict";
import { connectWallet } from "./wallet.js";

test("connects Rabet after the extension returns a public key", async () => {
  const wallet = await connectWallet("rabet", { rabet: { connect: async () => ({ publicKey: "GRABET" }) } });
  assert.deepEqual(wallet, { kind: "rabet", address: "GRABET", signing: "sign", network: "TESTNET_REQUESTED" });
});

test("uses the official Freighter SDK on Testnet", async () => {
  const wallet = await connectWallet("freighter", {
    __freighterSdk: { freighterApi: {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: "GFREIGHTER" }),
      getNetwork: async () => ({ network: "TESTNET" }),
    } },
  });
  assert.deepEqual(wallet, { kind: "freighter", address: "GFREIGHTER", signing: "signTransaction", network: "TESTNET" });
});

test("rejects Freighter when it reports Mainnet", async () => {
  await assert.rejects(connectWallet("freighter", {
    __freighterSdk: { freighterApi: {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: "GFREIGHTER" }),
      getNetwork: async () => ({ network: "PUBLIC" }),
    } },
  }), /Switch Freighter/);
});

test("uses the official browser global without transforming SDK exports", async () => {
  const wallet = await connectWallet("freighter", {
    freighterApi: {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: "GBROWSER" }),
      getNetwork: async () => ({ networkPassphrase: "Test SDF Network ; September 2015" }),
    },
  });
  assert.equal(wallet.address, "GBROWSER");
});
