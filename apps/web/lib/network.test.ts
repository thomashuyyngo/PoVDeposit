import { describe, expect, it } from "vitest";
import { isTestnet, TESTNET_PASSPHRASE } from "./network";

describe("isTestnet", () => {
  it("accepts only Stellar Testnet identifiers", () => {
    expect(isTestnet({ network: "TESTNET" })).toBe(true);
    expect(isTestnet({ networkPassphrase: TESTNET_PASSPHRASE })).toBe(true);
    expect(isTestnet({ network: "PUBLIC" })).toBe(false);
  });
});
