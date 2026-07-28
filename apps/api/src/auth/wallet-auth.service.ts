import { randomBytes, randomUUID } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { Keypair } from "@stellar/stellar-sdk";

type Challenge = {
  id: string;
  address: string;
  origin: string;
  message: string;
  expiresAt: string;
  used: boolean;
};

export const AUTH_CLOCK = Symbol("AUTH_CLOCK");
export const ALLOWED_ORIGINS = Symbol("ALLOWED_ORIGINS");

@Injectable()
export class WalletAuthService {
  private readonly challenges = new Map<string, Challenge>();

  constructor(
    @Optional() @Inject(AUTH_CLOCK) private readonly now: () => Date = () => new Date(),
    @Optional() @Inject(ALLOWED_ORIGINS) private readonly origins: string[] = [],
  ) {}

  issue(address: string, origin: string) {
    if (!this.origins.includes(origin)) throw new Error("Origin not allowed");
    Keypair.fromPublicKey(address);
    const id = randomUUID();
    const expiresAt = new Date(this.now().getTime() + 5 * 60_000).toISOString();
    const message = [
      "Proof-of-Visit Deposit authentication",
      `Address: ${address}`,
      "Network: TESTNET",
      `Origin: ${origin}`,
      `Nonce: ${randomBytes(32).toString("hex")}`,
      `Expires: ${expiresAt}`,
    ].join("\n");
    this.challenges.set(id, { id, address, origin, message, expiresAt, used: false });
    return { id, message, expiresAt, network: "TESTNET" as const };
  }

  verify(input: { challengeId: string; address: string; origin: string; signature: string }) {
    const challenge = this.challenges.get(input.challengeId);
    if (!challenge) throw new Error("Authentication challenge not found");
    if (challenge.used) throw new Error("Authentication challenge already used");
    if (new Date(challenge.expiresAt) <= this.now()) throw new Error("Authentication challenge expired");
    if (challenge.address !== input.address || challenge.origin !== input.origin) {
      throw new Error("Authentication challenge mismatch");
    }
    if (!Keypair.fromPublicKey(input.address).verify(
      Buffer.from(challenge.message),
      Buffer.from(input.signature, "base64"),
    )) throw new Error("Invalid wallet signature");
    challenge.used = true;
    return {
      token: randomBytes(32).toString("hex"),
      expiresAt: new Date(this.now().getTime() + 15 * 60_000).toISOString(),
    };
  }
}
