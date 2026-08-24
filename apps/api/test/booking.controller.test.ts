import { describe, expect, it } from "vitest";
import { BookingController } from "../src/booking/booking.controller.js";
import type { StellarSettings } from "../src/config/stellar.config.js";
import { CheckInChallengeService } from "../src/checkin/check-in-challenge.service.js";
import { BookingWorkflowService } from "../src/booking/booking-workflow.service.js";

const mainnet: StellarSettings = {
  network: "PUBLIC",
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  rpcUrl: "https://stellar.api.onfinality.io/public",
  horizonUrl: "https://horizon.stellar.org",
  contractId: "CBTPBD7SACNHMCU7F6EB7UCWUCR5IFA4SP2DCDSRSZO4DCBO3BPO2TJD",
};

const challenges = () => new CheckInChallengeService(
  () => new Date("2026-07-28T10:00:00Z"),
  Buffer.alloc(32, 7),
);

describe("BookingController", () => {
  it("creates a JSON-safe booking intent with explicit property evidence", async () => {
    const controller = new BookingController(
      new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z")),
      { verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }) } as never,
      mainnet,
      challenges(),
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
    } as never, mainnet, challenges());
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
    } as never, mainnet, challenges());
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

  it("only lets the renter record a check-in", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }),
    } as never, mainnet, challenges());
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });
    await controller.fund(booking.id, { transactionHash: "b".repeat(64) });
    const { token } = await controller.checkInChallenge(booking.id, { actor: "GHOST" });

    await expect(controller.checkIn(booking.id, { actor: "GHOST", token })).rejects.toThrow();
    expect((await service.get(booking.id)).state).toBe("FUNDED");
  });

  it("only lets the host issue a check-in challenge", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }),
    } as never, mainnet, challenges());
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });

    await expect(controller.checkInChallenge(booking.id, { actor: "GRENTER" }))
      .rejects.toThrow(/host/i);
  });

  it("refuses to replay a spent check-in challenge", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }),
    } as never, mainnet, challenges());
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });
    await controller.fund(booking.id, { transactionHash: "b".repeat(64) });
    const { token } = await controller.checkInChallenge(booking.id, { actor: "GHOST" });

    await controller.checkIn(booking.id, { actor: "GRENTER", token });
    await expect(controller.checkIn(booking.id, { actor: "GRENTER", token }))
      .rejects.toThrow(/already used/i);
  });

  it("carries a booking from funding through check-in to settlement", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const controller = new BookingController(service, {
      verifyFunding: async () => ({ ledger: 1, confirmedAt: "2026-07-28T10:00:00Z" }),
      verifySettlement: async () => ({ ledger: 2, confirmedAt: "2026-07-29T10:00:00Z" }),
    } as never, mainnet, challenges());
    const booking = await controller.create({
      listingId: "listing-01",
      renter: "GRENTER",
      host: "GHOST",
      depositAmount: "10000000",
      visitTime: "2026-07-29T10:00:00.000Z",
      evidenceHash: "a".repeat(64),
    });

    await controller.fund(booking.id, { transactionHash: "b".repeat(64) });
    const { token } = await controller.checkInChallenge(booking.id, { actor: "GHOST" });
    const checkedIn = await controller.checkIn(booking.id, { actor: "GRENTER", token });
    expect(checkedIn.state).toBe("CHECKED_IN");
    expect(checkedIn.checkInProofHash).toMatch(/^[a-f0-9]{64}$/);

    const settled = await controller.confirm(booking.id, {
      actor: "GHOST",
      transactionHash: "d".repeat(64),
    });
    expect(settled.state).toBe("COMPLETED");
  });
});
