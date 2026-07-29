import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { Keypair } from "@stellar/stellar-sdk";
import { PrismaService } from "../database/prisma.service.js";

type Challenge = {
  id: string;
  address: string;
  origin: string;
  message: string;
  expiresAt: string;
  network: string;
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
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async issue(address: string, origin: string) {
    if (!this.origins.includes(origin)) throw new Error("Origin not allowed");
    Keypair.fromPublicKey(address);
    const id = randomUUID();
    const network = "PUBLIC";
    const expiresAt = new Date(this.now().getTime() + 5 * 60_000).toISOString();
    const message = [
      "Proof-of-Visit Deposit authentication",
      `Address: ${address}`,
      `Network: ${network}`,
      `Origin: ${origin}`,
      `Nonce: ${id}`,
      `Expires: ${expiresAt}`,
    ].join("\n");
    this.challenges.set(id, { id, address, origin, message, expiresAt, network, used: false });
    if (this.prisma) {
      const wallet = await this.prisma.walletIdentity.upsert({
        where: { address },
        update: { network },
        create: { address, network },
      });
      await this.prisma.authChallenge.create({
        data: {
          id,
          walletId: wallet.id,
          nonceHash: this.hash(id),
          origin,
          network,
          expiresAt: new Date(expiresAt),
        },
      });
    }
    return { id, message, expiresAt, network };
  }

  async verify(input: { challengeId: string; address: string; origin: string; signature: string }) {
    let challenge = this.challenges.get(input.challengeId);
    if (!challenge && this.prisma) {
      const stored = await this.prisma.authChallenge.findUnique({
        where: { id: input.challengeId },
        include: { wallet: true },
      });
      if (stored) {
        challenge = {
          id: stored.id,
          address: stored.wallet.address,
          origin: stored.origin,
          message: this.message(stored.id, stored.wallet.address, stored.origin, stored.expiresAt.toISOString(), stored.network),
          expiresAt: stored.expiresAt.toISOString(),
          network: stored.network,
          used: Boolean(stored.consumedAt),
        };
      }
    }
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
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(this.now().getTime() + 15 * 60_000);
    if (this.prisma) {
      await this.prisma.$transaction(async (database) => {
        const consumed = await database.authChallenge.updateMany({
          where: { id: challenge.id, consumedAt: null },
          data: { consumedAt: this.now() },
        });
        if (consumed.count !== 1) throw new Error("Authentication challenge already used");
        const wallet = await database.walletIdentity.findUniqueOrThrow({ where: { address: input.address } });
        await database.userSession.create({
          data: { walletId: wallet.id, tokenHash: this.hash(token), expiresAt },
        });
      });
    }
    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private message(id: string, address: string, origin: string, expiresAt: string, network: string) {
    return [
      "Proof-of-Visit Deposit authentication",
      `Address: ${address}`,
      `Network: ${network}`,
      `Origin: ${origin}`,
      `Nonce: ${id}`,
      `Expires: ${expiresAt}`,
    ].join("\n");
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
