import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

type CheckInPayload = {
  version: 1;
  bookingId: string;
  renter: string;
  nonce: string;
  expiresAt: string;
};

export const CHECKIN_CLOCK = Symbol("CHECKIN_CLOCK");
export const CHECKIN_SECRET = Symbol("CHECKIN_SECRET");

@Injectable()
export class CheckInChallengeService {
  private readonly used = new Set<string>();

  constructor(
    @Optional() @Inject(CHECKIN_CLOCK) private readonly now: () => Date = () => new Date(),
    @Optional() @Inject(CHECKIN_SECRET) private readonly secret: Buffer = randomBytes(32),
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async issue(bookingId: string, renter: string) {
    const payload: CheckInPayload = {
      version: 1,
      bookingId,
      renter,
      nonce: randomBytes(32).toString("hex"),
      expiresAt: new Date(this.now().getTime() + 2 * 60_000).toISOString(),
    };
    if (this.prisma) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: bookingId, renter: { address: renter } },
        select: { id: true },
      });
      if (!booking) throw new Error("Booking not found for renter");
      await this.prisma.checkInChallenge.create({
        data: {
          bookingId,
          nonceHash: this.hashNonce(payload.nonce),
          expiresAt: new Date(payload.expiresAt),
        },
      });
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return { token: `${encoded}.${this.sign(encoded)}`, payload };
  }

  async consume(token: string, bookingId: string, renter: string): Promise<CheckInPayload> {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra || !this.validSignature(encoded, signature)) {
      throw new Error("Invalid check-in token");
    }
    let payload: CheckInPayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CheckInPayload;
    } catch {
      throw new Error("Invalid check-in token");
    }
    if (payload.version !== 1 || payload.bookingId !== bookingId || payload.renter !== renter) {
      throw new Error("Check-in challenge mismatch");
    }
    if (new Date(payload.expiresAt) <= this.now()) throw new Error("Check-in challenge expired");
    if (this.prisma) {
      await this.prisma.$transaction(async (database) => {
        const challenge = await database.checkInChallenge.findUnique({
          where: { nonceHash: this.hashNonce(payload.nonce) },
        });
        if (!challenge || challenge.bookingId !== bookingId) throw new Error("Check-in challenge mismatch");
        if (challenge.consumedAt) throw new Error("Check-in challenge already used");
        if (challenge.expiresAt <= this.now()) throw new Error("Check-in challenge expired");
        const consumed = await database.checkInChallenge.updateMany({
          where: { id: challenge.id, consumedAt: null },
          data: { consumedAt: this.now() },
        });
        if (consumed.count !== 1) throw new Error("Check-in challenge already used");
      });
    } else {
      if (this.used.has(token)) throw new Error("Check-in challenge already used");
      this.used.add(token);
    }
    return payload;
  }

  private hashNonce(nonce: string): string {
    return createHash("sha256").update(nonce).digest("hex");
  }

  private sign(encoded: string): string {
    return createHmac("sha256", this.secret).update(encoded).digest("base64url");
  }

  private validSignature(encoded: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(encoded));
    const supplied = Buffer.from(signature);
    return expected.length === supplied.length && timingSafeEqual(expected, supplied);
  }
}
