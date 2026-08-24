import { describe, expect, it } from "vitest";
import { readStellarSettings } from "../src/config/stellar.config.js";

describe("readStellarSettings", () => {
  it("pairs Mainnet with Mainnet endpoints by default", () => {
    expect(readStellarSettings({} as NodeJS.ProcessEnv)).toMatchObject({
      network: "PUBLIC",
      networkPassphrase: "Public Global Stellar Network ; September 2015",
      horizonUrl: "https://horizon.stellar.org",
      rpcUrl: "https://stellar.api.onfinality.io/public",
    });
  });

  it("pairs Testnet with Testnet endpoints", () => {
    expect(readStellarSettings({ STELLAR_NETWORK: "TESTNET" } as NodeJS.ProcessEnv)).toMatchObject({
      network: "TESTNET",
      networkPassphrase: "Test SDF Network ; September 2015",
      horizonUrl: "https://horizon-testnet.stellar.org",
      rpcUrl: "https://soroban-testnet.stellar.org",
    });
  });

  it("rejects a passphrase from the other network", () => {
    expect(() => readStellarSettings({
      STELLAR_NETWORK: "PUBLIC",
      STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    } as NodeJS.ProcessEnv)).toThrow(/does not belong to PUBLIC/);
  });

  it("rejects a Horizon endpoint from the other network", () => {
    expect(() => readStellarSettings({
      STELLAR_NETWORK: "PUBLIC",
      STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
    } as NodeJS.ProcessEnv)).toThrow(/must serve PUBLIC/);
  });

  it("passes the escrow contract id through", () => {
    expect(readStellarSettings({
      ESCROW_CONTRACT_ID: "CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD",
    } as NodeJS.ProcessEnv).contractId)
      .toBe("CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD");
  });
});
