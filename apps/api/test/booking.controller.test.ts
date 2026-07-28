import { describe, expect, it } from "vitest";
import { BookingController } from "../src/booking/booking.controller.js";
import { BookingWorkflowService } from "../src/booking/booking-workflow.service.js";

describe("BookingController", () => {
  it("creates a JSON-safe booking intent with explicit property evidence", () => {
    const controller = new BookingController(
      new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z")),
      { verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }) } as never,
    );
    const result = controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });
    expect(result).toMatchObject({
      listingId: "listing-01",
      depositAmount: "10000000",
      state: "PENDING_FUNDING",
      network: "TESTNET",
    });
  });

  it("does not mark a booking funded when Testnet verification fails", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => { throw new Error("Transaction is not successful on Stellar Testnet"); },
    } as never);
    const booking = controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });

    await expect(controller.fund(booking.id, { transactionHash: "a".repeat(64) }))
      .rejects.toThrow("not successful");
    expect(service.get(booking.id).state).toBe("PENDING_FUNDING");
  });
});
