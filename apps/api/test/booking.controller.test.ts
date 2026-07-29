import { describe, expect, it } from "vitest";
import { BookingController } from "../src/booking/booking.controller.js";
import { BookingWorkflowService } from "../src/booking/booking-workflow.service.js";

describe("BookingController", () => {
  it("creates a JSON-safe booking intent with explicit property evidence", async () => {
    const controller = new BookingController(
      new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z")),
      { verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }) } as never,
    );
    const result = await controller.create({
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
      network: "PUBLIC",
    });
  });

  it("does not mark a booking funded when Mainnet verification fails", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => { throw new Error("Transaction is not successful on Stellar Mainnet"); },
    } as never);
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });

    await expect(controller.fund(booking.id, { transactionHash: "a".repeat(64) }))
      .rejects.toThrow("not successful");
    expect((await service.get(booking.id)).state).toBe("PENDING_FUNDING");
  });

  it("verifies funding against the Soroban u64 booking id, not the database UUID", async () => {
    let verifiedBookingId = "";
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async (_hash: string, bookingId: string) => {
        verifiedBookingId = bookingId;
        return { ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" };
      },
    } as never);
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });

    await controller.fund(booking.id, { transactionHash: "b".repeat(64) });

    expect(verifiedBookingId).toBe(booking.onChainBookingId);
    expect(verifiedBookingId).not.toBe(booking.id);
  });

  it("does not accept check-in without a matching on-chain event", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }),
      verifyCheckIn: async () => { throw new Error("missing renter_checked_in event"); },
    } as never);
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });
    await controller.fund(booking.id, { transactionHash: "b".repeat(64) });

    await expect(controller.checkIn(booking.id, {
      actor: "GRENTER",
      proofHash: "c".repeat(64),
      transactionHash: "d".repeat(64),
    })).rejects.toThrow("missing renter_checked_in event");
    expect((await service.get(booking.id)).state).toBe("FUNDED");
  });
});
