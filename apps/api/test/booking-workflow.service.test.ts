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
  it("mirrors the funded, checked-in, and completed on-chain lifecycle", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    const created = await service.create(input);
    expect(created.state).toBe("PENDING_FUNDING");
    expect(created.onChainBookingId).toMatch(/^[1-9]\d{0,19}$/);
    expect(BigInt(created.onChainBookingId)).toBeLessThanOrEqual(18_446_744_073_709_551_615n);

    expect((await service.fund(created.id, "b".repeat(64))).state).toBe("FUNDED");
    expect((await service.checkIn(created.id, input.renter, "c".repeat(64))).state).toBe("CHECKED_IN");
    expect((await service.confirm(created.id, input.host, "d".repeat(64))).state).toBe("COMPLETED");
  });

  it("rejects invalid actors, transitions, and booking boundaries", async () => {
    const service = new BookingWorkflowService(() => new Date("2026-07-28T10:00:00Z"));
    await expect(service.create({ ...input, renter: input.host })).rejects.toThrow("Renter and host must differ");
    await expect(service.create({ ...input, visitTime: "2026-07-27T10:00:00.000Z" }))
      .rejects.toThrow("Visit time must be in the future");

    const created = await service.create(input);
    await expect(service.checkIn(created.id, input.renter, "c".repeat(64)))
      .rejects.toThrow("Booking must be funded");
    await service.fund(created.id, "b".repeat(64));
    await expect(service.checkIn(created.id, "GOTHER", "c".repeat(64)))
      .rejects.toThrow("Only renter can check in");
  });

  it("persists a booking against the approved property and unbooked slot", async () => {
    const writes: unknown[] = [];
    const prisma = {
      property: {
        findFirst: async () => ({
          id: "property-01",
          slug: input.listingId,
          hostId: "host-01",
          host: { address: input.host },
          slots: [{ id: "slot-01" }],
        }),
      },
      walletIdentity: {
        upsert: async () => ({ id: "renter-01" }),
      },
      booking: {
        create: async ({ data }: { data: unknown }) => {
          writes.push(data);
          return {
            id: "booking-01",
            onChainBookingId: "42",
            property: { slug: input.listingId },
            renter: { address: input.renter },
            host: { address: input.host },
            depositAmount: input.depositAmount,
            visitTime: new Date(input.visitTime),
            evidenceHash: input.evidenceHash,
            status: "PENDING_FUNDING",
            createdAt: new Date("2026-07-28T10:00:00Z"),
            updatedAt: new Date("2026-07-28T10:00:00Z"),
            transactions: [],
          };
        },
      },
      $transaction: async (run: (database: unknown) => Promise<unknown>) => run(prisma),
    };
    const service = new BookingWorkflowService(
      () => new Date("2026-07-28T10:00:00Z"),
      prisma as never,
    );

    await expect(service.create(input)).resolves.toMatchObject({
      id: "booking-01",
      onChainBookingId: "42",
      listingId: input.listingId,
      state: "PENDING_FUNDING",
    });
    expect(writes).toMatchObject([{ onChainBookingId: expect.stringMatching(/^[1-9]\d{0,19}$/) }]);
  });
});
