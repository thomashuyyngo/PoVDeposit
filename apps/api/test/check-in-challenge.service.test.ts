import { describe, expect, it } from "vitest";
import { CheckInChallengeService } from "../src/checkin/check-in-challenge.service.js";

describe("CheckInChallengeService", () => {
  it("binds a short-lived one-time QR token to booking and renter", () => {
    const service = new CheckInChallengeService(() => new Date("2026-07-28T10:00:00Z"));
    const challenge = service.issue("booking-01", "GRENTER");
    expect(challenge.payload).toMatchObject({
      version: 1,
      bookingId: "booking-01",
      renter: "GRENTER",
      expiresAt: "2026-07-28T10:02:00.000Z",
    });
    expect(challenge.payload.nonce).toMatch(/^[a-f0-9]{64}$/);

    expect(service.consume(challenge.token, "booking-01", "GRENTER")).toMatchObject({
      bookingId: "booking-01",
      renter: "GRENTER",
    });
    expect(() => service.consume(challenge.token, "booking-01", "GRENTER"))
      .toThrow("Check-in challenge already used");
  });

  it("rejects tampering, wrong booking, and expiration", () => {
    let now = new Date("2026-07-28T10:00:00Z");
    const service = new CheckInChallengeService(() => now);
    const challenge = service.issue("booking-01", "GRENTER");
    expect(() => service.consume(`${challenge.token}x`, "booking-01", "GRENTER"))
      .toThrow("Invalid check-in token");
    expect(() => service.consume(challenge.token, "booking-02", "GRENTER"))
      .toThrow("Check-in challenge mismatch");
    now = new Date("2026-07-28T10:03:00Z");
    expect(() => service.consume(challenge.token, "booking-01", "GRENTER"))
      .toThrow("Check-in challenge expired");
  });
});
