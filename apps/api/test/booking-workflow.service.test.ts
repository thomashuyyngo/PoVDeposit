import { describe, expect, it } from "vitest";
import { BookingWorkflowService } from "../src/booking/booking-workflow.service.js";

const input = {
  listingId: "listing-01",
  renter: "GRENTER",
  host: "GHOST",
  depositAmount: 10_000_000n,
  visitTime: "2026-07-29T10:00:00.000Z",
  evidenceHash: "a".repeat(64),
};

describe("BookingWorkflowService", () => {
  it("mirrors the funded, checked-in, and completed on-chain lifecycle", () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const created = service.create(input);
    expect(created.state).toBe("PENDING_FUNDING");

    expect(service.fund(created.id, "b".repeat(64)).state).toBe("FUNDED");
    expect(service.checkIn(created.id, input.renter, "c".repeat(64)).state).toBe("CHECKED_IN");
    expect(service.confirm(created.id, input.host, "d".repeat(64)).state).toBe("COMPLETED");
  });

  it("rejects invalid actors, transitions, and booking boundaries", () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    expect(() => service.create({ ...input, renter: input.host })).toThrow("Renter and host must differ");
    expect(() => service.create({ ...input, visitTime: "2026-07-27T10:00:00.000Z" }))
      .toThrow("Visit time must be in the future");

    const created = service.create(input);
    expect(() => service.checkIn(created.id, input.renter, "c".repeat(64)))
      .toThrow("Booking must be funded");
    service.fund(created.id, "b".repeat(64));
    expect(() => service.checkIn(created.id, "GOTHER", "c".repeat(64))).toThrow("Only renter can check in");
  });
});
