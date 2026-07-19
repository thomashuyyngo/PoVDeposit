import test from "node:test";
import assert from "node:assert/strict";
import { createBookingIntent, persistBookingIntent } from "../src/booking.js";

test("rejects an incomplete booking request", () => {
  assert.deepEqual(createBookingIntent({ renter: "", host: "GHOST", deposit: 1 }), {
    status: 422,
    body: { error: "renter, host, and positive deposit are required" },
  });
});

test("rejects a booking where renter and host are the same wallet", () => {
  assert.deepEqual(createBookingIntent({ renter: "GSAME", host: "GSAME", deposit: 1 }), {
    status: 422,
    body: { error: "renter and host must be different" },
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

test("persists a valid intent without treating it as an on-chain booking", async () => {
  const calls = [];
  const pool = {
    async query(sql, values) {
      calls.push({ sql, values });
      return { rows: [{ id: "9d15d046-2a32-4eb2-97ce-e5163c122a00" }] };
    },
  };

  const result = await persistBookingIntent(pool, {
    renter: "GRENT",
    host: "GHOST",
    deposit: 500_000_000,
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.id, "9d15d046-2a32-4eb2-97ce-e5163c122a00");
  assert.equal(result.body.state, "PENDING_FUNDING");
  assert.match(calls[0].sql, /INSERT INTO booking_intents/);
  assert.deepEqual(calls[0].values, ["GRENT", "GHOST", 500_000_000]);
});
