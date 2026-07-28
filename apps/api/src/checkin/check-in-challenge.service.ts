import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";

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
  ) {}

  issue(bookingId: string, renter: string) {
    const payload: CheckInPayload = {
      version: 1,
      bookingId,
      renter,
      nonce: randomBytes(32).toString("hex"),
      expiresAt: new Date(this.now().getTime() + 2 * 60_000).toISOString(),
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return { token: `${encoded}.${this.sign(encoded)}`, payload };
  }

  consume(token: string, bookingId: string, renter: string): CheckInPayload {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra || !this.validSignature(encoded, signature)) {
      throw new Error("Invalid check-in token");
    }
    if (this.used.has(token)) throw new Error("Check-in challenge already used");
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
    this.used.add(token);
    return payload;
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
