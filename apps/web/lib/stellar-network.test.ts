import { describe, expect, it } from "vitest";
import { explorerTransactionUrl, stellarProfile } from "./stellar-network";

describe("stellarProfile", () => {
  it("defaults to Mainnet when the variable is unset", () => {
    expect(stellarProfile(undefined).network).toBe("PUBLIC");
    expect(stellarProfile("").network).toBe("PUBLIC");
  });

  it("selects Testnet regardless of casing or padding", () => {
    for (const raw of ["TESTNET", "testnet", " Testnet "]) {
      expect(stellarProfile(raw).network).toBe("TESTNET");
    }
  });

  it("pairs each network with its own Horizon and explorer", () => {
    expect(stellarProfile("PUBLIC")).toMatchObject({
      label: "Mainnet",
      horizonUrl: "https://horizon.stellar.org",
    });
    expect(stellarProfile("TESTNET")).toMatchObject({
      label: "Testnet",
      horizonUrl: "https://horizon-testnet.stellar.org",
    });
  });

  it("treats an unknown value as Mainnet rather than guessing", () => {
    expect(stellarProfile("futurenet").network).toBe("PUBLIC");
  });
});

describe("explorerTransactionUrl", () => {
  it("links a transaction on the network it settled on", () => {
    const hash = "4450114d76babff0bffb5b20e23bdaca4133b2be7da4c91b195a0c95846a1ec4";

    expect(explorerTransactionUrl(hash, stellarProfile("PUBLIC")))
      .toBe(`https://stellar.expert/explorer/public/tx/${hash}`);
    expect(explorerTransactionUrl(hash, stellarProfile("TESTNET")))
      .toBe(`https://stellar.expert/explorer/testnet/tx/${hash}`);
  });
});
