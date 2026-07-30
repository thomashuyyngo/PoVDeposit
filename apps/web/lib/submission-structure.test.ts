import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("judged submission entrypoints", () => {
  it("exposes the Soroban source in the conventional root contract folder", () => {
    expect(existsSync(resolve(process.cwd(), "../../contracts/pov_deposit_escrow/src/lib.rs"))).toBe(true);
  });

  it("keeps frontend method names aligned with the Soroban contract", () => {
    const integration = readFileSync(resolve(process.cwd(), "lib/contract.ts"), "utf8");
    expect(integration).toContain('"create_booking"');
    expect(integration).toContain('"fund_booking"');
  });
});
