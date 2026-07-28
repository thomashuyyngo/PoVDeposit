import { nativeToScVal, rpc } from "@stellar/stellar-sdk";
import { afterEach, describe, expect, it } from "vitest";
import { ContractTransactionVerifier } from "../src/stellar/contract-transaction-verifier.js";

const originalContract = process.env.ESCROW_CONTRACT_ID;
afterEach(() => { process.env.ESCROW_CONTRACT_ID = originalContract; });

describe("ContractTransactionVerifier", () => {
  it("accepts only a successful matching booking_funded contract event", async () => {
    process.env.ESCROW_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";
    const hash = "a".repeat(64);
    const verifier = new ContractTransactionVerifier({
      getTransaction: async () => ({
        status: rpc.Api.GetTransactionStatus.SUCCESS,
        ledger: 123,
        createdAt: 1_800_000_000,
      }),
      getEvents: async () => ({
        events: [{
          txHash: hash,
          inSuccessfulContractCall: true,
          topic: [nativeToScVal("booking_funded", { type: "symbol" }), nativeToScVal(42n, { type: "u64" })],
        }],
      }),
    } as never);

    await expect(verifier.verifyFunding(hash, "42")).resolves.toMatchObject({ ledger: 123 });
    await expect(verifier.verifyFunding(hash, "43")).rejects.toThrow("expected booking_funded event");
  });

  it("rejects an unsuccessful transaction", async () => {
    process.env.ESCROW_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";
    const verifier = new ContractTransactionVerifier({
      getTransaction: async () => ({ status: rpc.Api.GetTransactionStatus.FAILED }),
    } as never);
    await expect(verifier.verifyFunding("b".repeat(64), "42")).rejects.toThrow("not successful");
  });
});
