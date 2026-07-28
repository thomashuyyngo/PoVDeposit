import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { WalletAuthService } from "../src/auth/wallet-auth.service.js";
import type { PrismaService } from "../src/database/prisma.service.js";

describe("WalletAuthService", () => {
  it("authenticates a signed Testnet challenge once", async () => {
    const wallet = Keypair.random();
    const service = new WalletAuthService(
      () => new Date("2026-07-28T10:00:00Z"),
      ["https://app.example"],
    );
    const challenge = await service.issue(wallet.publicKey(), "https://app.example");
    const signature = wallet.sign(Buffer.from(challenge.message)).toString("base64");
    expect((await service.verify({
      challengeId: challenge.id,
      address: wallet.publicKey(),
      origin: "https://app.example",
      signature,
    })).token).toMatch(/^[a-f0-9]{64}$/);
    await expect(service.verify({
      challengeId: challenge.id,
      address: wallet.publicKey(),
      origin: "https://app.example",
      signature,
    })).rejects.toThrow("Authentication challenge already used");
  });

  it("rejects unapproved origins and expired challenges", async () => {
    const wallet = Keypair.random();
    let now = new Date("2026-07-28T10:00:00Z");
    const service = new WalletAuthService(() => now, ["https://app.example"]);
    await expect(service.issue(wallet.publicKey(), "https://evil.example")).rejects.toThrow("Origin not allowed");
    const challenge = await service.issue(wallet.publicKey(), "https://app.example");
    now = new Date("2026-07-28T10:06:00Z");
    await expect(service.verify({
      challengeId: challenge.id,
      address: wallet.publicKey(),
      origin: "https://app.example",
      signature: wallet.sign(Buffer.from(challenge.message)).toString("base64"),
    })).rejects.toThrow("Authentication challenge expired");
  });

  it("stores only hashed challenge and session tokens", async () => {
    const wallet = Keypair.random();
    let challengeRecord: Record<string, unknown> | undefined;
    let sessionRecord: Record<string, unknown> | undefined;
    const database = {
      walletIdentity: {
        upsert: async () => ({ id: "wallet-id" }),
        findUniqueOrThrow: async () => ({ id: "wallet-id" }),
      },
      authChallenge: {
        create: async ({ data }: { data: Record<string, unknown> }) => { challengeRecord = data; },
        updateMany: async () => ({ count: 1 }),
      },
      userSession: {
        create: async ({ data }: { data: Record<string, unknown> }) => { sessionRecord = data; },
      },
      $transaction: async (operation: (client: unknown) => Promise<void>) => operation(database),
    } as unknown as PrismaService;
    const service = new WalletAuthService(
      () => new Date("2026-07-28T10:00:00Z"),
      ["https://app.example"],
      database,
    );

    const challenge = await service.issue(wallet.publicKey(), "https://app.example");
    const result = await service.verify({
      challengeId: challenge.id,
      address: wallet.publicKey(),
      origin: "https://app.example",
      signature: wallet.sign(Buffer.from(challenge.message)).toString("base64"),
    });

    expect(challengeRecord?.nonceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(challengeRecord?.nonceHash).not.toBe(challenge.id);
    expect(sessionRecord?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionRecord?.tokenHash).not.toBe(result.token);
  });
});
