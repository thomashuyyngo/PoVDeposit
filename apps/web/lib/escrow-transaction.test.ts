import { Contract, Keypair, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { bookingArguments, escrowOperation } from "./escrow-transaction";

describe("escrowOperation", () => {
  it("encodes the selected contract method and booking id", () => {
    const contractId = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";
    const operation = escrowOperation(contractId, "fund_booking", [
      nativeToScVal(Keypair.random().publicKey(), { type: "address" }),
      nativeToScVal(42n, { type: "u64" }),
    ]);
    const invocation = operation.body().invokeHostFunctionOp().hostFunction().invokeContract();

    expect(new Contract(contractId).contractId()).toBe(contractId);
    expect(invocation.functionName().toString()).toBe("fund_booking");
    expect(scValToNative(invocation.args()[1])).toBe(42n);
  });

  it("encodes the complete current create_booking arguments", () => {
    const args = bookingArguments({
      bookingId: "42",
      renter: Keypair.random().publicKey(),
      host: Keypair.random().publicKey(),
      depositAmount: "1000000",
      visitTime: 2_000,
    });

    expect(args).toHaveLength(5);
    expect(scValToNative(args[0])).toBe(42n);
    expect(scValToNative(args[3])).toBe(1_000_000n);
  });
});
