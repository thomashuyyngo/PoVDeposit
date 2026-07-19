import test from "node:test";
import assert from "node:assert/strict";
import { createBookingIntent } from "../src/booking.js";

test("rejects an incomplete booking request", () => {
  assert.deepEqual(createBookingIntent({ renter: "", host: "GHOST", deposit: 1 }), {
    status: 422,
    body: { error: "renter, host, and positive deposit are required" },
  });
});

test("creates a pending-funding booking intent", () => {
  const result = createBookingIntent({ renter: "GRENT", host: "GHOST", deposit: 500_000_000 });

  assert.equal(result.status, 201);
  assert.deepEqual(result.body, {
    renter: "GRENT",
    host: "GHOST",
    deposit: 500_000_000,
    state: "PENDING_FUNDING",
  });
});
