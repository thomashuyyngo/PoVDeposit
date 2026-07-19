import test from "node:test";
import assert from "node:assert/strict";
import { connectWallet } from "./wallet.js";

test("connects Rabet after the extension returns a public key", async () => {
  const wallet = await connectWallet("rabet", { rabet: { connect: async () => ({ publicKey: "GRABET" }) } });
  assert.deepEqual(wallet, { kind: "rabet", address: "GRABET", signing: "sign", network: "TESTNET_REQUESTED" });
});
