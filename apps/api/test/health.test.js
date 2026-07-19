import test from "node:test";
import assert from "node:assert/strict";
import { health } from "../src/health.js";

test("reports the booking api as ready", () => {
  assert.deepEqual(health(), { status: "ok" });
});
