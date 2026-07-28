import { describe, expect, it } from "vitest";
import { checkInSecret } from "../src/config/secrets.js";

describe("checkInSecret", () => {
  it("fails closed when production has no secret", () => {
    expect(() => checkInSecret({ NODE_ENV: "production" })).toThrow("required in production");
    expect(checkInSecret({ NODE_ENV: "production", CHECKIN_TOKEN_SECRET: "configured-secret" }).toString())
      .toBe("configured-secret");
  });
});
