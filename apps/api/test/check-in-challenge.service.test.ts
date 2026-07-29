import { describe, expect, it } from "vitest";
import { CheckInChallengeService } from "../src/checkin/check-in-challenge.service.js";

describe("CheckInChallengeService", () => {
  it("binds a short-lived one-time QR token to booking and renter", async () => {
    const service = new CheckInChallengeService(() => new Date("2026-07-28T10:00:00Z"));
    const challenge = await service.issue("booking-01", "GRENTER");
    expect(challenge.payload).toMatchObject({
      version: 1,
      bookingId: "booking-01",
      renter: "GRENTER",
      expiresAt: "2026-07-28T10:02:00.000Z",
    });
    expect(challenge.payload.nonce).toMatch(/^[a-f0-9]{64}$/);

    await expect(service.consume(challenge.token, "booking-01", "GRENTER")).resolves.toMatchObject({
      bookingId: "booking-01",
      renter: "GRENTER",
    });
    await expect(service.consume(challenge.token, "booking-01", "GRENTER"))
      .rejects.toThrow("Check-in challenge already used");
  });

  it("rejects tampering, wrong booking, and expiration", async () => {
    let now = new Date("2026-07-28T10:00:00Z");
    const service = new CheckInChallengeService(() => now);
    const challenge = await service.issue("booking-01", "GRENTER");
    await expect(service.consume(`${challenge.token}x`, "booking-01", "GRENTER"))
      .rejects.toThrow("Invalid check-in token");
    await expect(service.consume(challenge.token, "booking-02", "GRENTER"))
      .rejects.toThrow("Check-in challenge mismatch");
    now = new Date("2026-07-28T10:03:00Z");
    await expect(service.consume(challenge.token, "booking-01", "GRENTER"))
      .rejects.toThrow("Check-in challenge expired");
  });

  it("persists nonce hashes and consumes a challenge exactly once", async () => {
    const challenges = new Map<string, {
      id: string;
      bookingId: string;
      nonceHash: string;
      expiresAt: Date;
      consumedAt: Date | null;
    }>();
    const prisma = {
      booking: {
        findFirst: async ({ where }: { where: { id: string; renter: { address: string } } }) =>
          where.id === "booking-01" && where.renter.address === "GRENTER" ? { id: "booking-01" } : null,
      },
      checkInChallenge: {
        create: async ({ data }: { data: Omit<(typeof challenges extends Map<string, infer V> ? V : never), "id" | "consumedAt"> }) => {
          const stored = { id: "challenge-01", ...data, consumedAt: null };
          challenges.set(stored.nonceHash, stored);
          return stored;
        },
        findUnique: async ({ where }: { where: { nonceHash: string } }) => challenges.get(where.nonceHash) ?? null,
        updateMany: async ({ where, data }: {
          where: { id: string; consumedAt: null };
          data: { consumedAt: Date };
        }) => {
          const stored = [...challenges.values()].find((value) => value.id === where.id && value.consumedAt === null);
          if (!stored) return { count: 0 };
          stored.consumedAt = data.consumedAt;
          return { count: 1 };
        },
      },
      $transaction: async (run: (database: unknown) => Promise<unknown>) => run(prisma),
    };
    const service = new CheckInChallengeService(
      () => new Date("2026-07-28T10:00:00Z"),
      Buffer.alloc(32, 7),
      prisma as never,
    );

    const challenge = await service.issue("booking-01", "GRENTER");
    expect(challenges.size).toBe(1);
    expect([...challenges.keys()][0]).not.toBe(challenge.payload.nonce);
    await expect(service.consume(challenge.token, "booking-01", "GRENTER")).resolves.toMatchObject({
      bookingId: "booking-01",
    });
    await expect(service.consume(challenge.token, "booking-01", "GRENTER"))
      .rejects.toThrow("Check-in challenge already used");
  });
});
