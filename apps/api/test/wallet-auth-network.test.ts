import { describe, expect, it } from "vitest";
import { WalletAuthService } from "../src/auth/wallet-auth.service.js";
import type { StellarSettings } from "../src/config/stellar.config.js";

const testnet = { network: "TESTNET" } as StellarSettings;
const address = "GCKJEORLGORT3BOUME2DQJQPKRSKST55BIZOSDZTNJ7FIGIV4KQMDDPX";

describe("WalletAuthService network", () => {
  it("names the configured network in the message the wallet signs", async () => {
    const service = new WalletAuthService(
      () => new Date("2026-07-28T10:00:00Z"),
      ["http://localhost:3000"],
      undefined,
      testnet,
    );

    const challenge = await service.issue(address, "http://localhost:3000");

    expect(challenge.network).toBe("TESTNET");
    expect(challenge.message).toContain("Network: TESTNET");
  });
});
