import { describe, expect, it } from "vitest";
import { isExpectedNetwork, isTestnet, TESTNET_PASSPHRASE } from "./network";

describe("isTestnet", () => {
  it("accepts only Stellar Testnet identifiers", () => {
    expect(isTestnet({ network: "TESTNET" })).toBe(true);
    expect(isTestnet({ networkPassphrase: TESTNET_PASSPHRASE })).toBe(true);
    expect(isTestnet({ network: "PUBLIC" })).toBe(false);
  });
});

describe("isExpectedNetwork", () => {
  it("accepts PUBLIC only when the application targets Mainnet", () => {
    expect(isExpectedNetwork({ network: "PUBLIC" }, "PUBLIC")).toBe(true);
    expect(isExpectedNetwork({ network: "TESTNET" }, "PUBLIC")).toBe(false);
  });
});
