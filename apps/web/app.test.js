import test from "node:test";
import assert from "node:assert/strict";
import { createBooking, xlmToStroops } from "./app.js";

test("converts XLM into integer stroops", () => {
  assert.equal(xlmToStroops("1.25"), 12_500_000);
  assert.throws(() => xlmToStroops("0"), /greater than 0/);
});

test("creates a pending booking intent through the API", async () => {
  let request;
  const result = await createBooking(
    { renter: " GRENT ", host: " GHOST ", depositXlm: "2" },
    async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ id: "booking-1", state: "PENDING_FUNDING" }) };
    },
  );

  assert.equal(request.url, "/api/bookings");
  assert.deepEqual(JSON.parse(request.options.body), { renter: "GRENT", host: "GHOST", deposit: 20_000_000 });
  assert.deepEqual(result, { id: "booking-1", state: "PENDING_FUNDING" });
});

test("surfaces booking validation errors from the API", async () => {
  await assert.rejects(
    createBooking(
      { renter: "GSAME", host: "GSAME", depositXlm: "1" },
      async () => ({ ok: false, json: async () => ({ error: "renter and host must be different" }) }),
    ),
    /must be different/,
  );
});
