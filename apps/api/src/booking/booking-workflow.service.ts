import { randomUUID } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

export type BookingState =
  | "PENDING_FUNDING"
  | "FUNDED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "RENTER_NO_SHOW"
  | "HOST_NO_SHOW"
  | "DISPUTED"
  | "REFUNDED"
  | "RELEASED"
  | "SPLIT"
  | "EXPIRED";

type CreateBooking = {
  listingId: string;
  renter: string;
  host: string;
  depositAmount: bigint;
  visitTime: string;
  evidenceHash: string;
};

type Booking = CreateBooking & {
  id: string;
  onChainBookingId: string;
  state: BookingState;
  fundingTransactionHash?: string;
  checkInProofHash?: string;
  settlementTransactionHash?: string;
  createdAt: string;
  updatedAt: string;
};

export const BOOKING_CLOCK = Symbol("BOOKING_CLOCK");

@Injectable()
export class BookingWorkflowService {
  private readonly bookings = new Map<string, Booking>();

  constructor(
    @Optional() @Inject(BOOKING_CLOCK) private readonly now: () => Date = () => new Date(),
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async create(input: CreateBooking): Promise<Booking> {
    if (input.renter === input.host) throw new Error("Renter and host must differ");
    if (input.depositAmount <= 0n || input.depositAmount > 100_000_000_000n) {
      throw new Error("Deposit amount out of bounds");
    }
    if (new Date(input.visitTime) <= this.now()) throw new Error("Visit time must be in the future");
    if (!/^[a-f0-9]{64}$/i.test(input.evidenceHash)) throw new Error("Invalid evidence hash");
    const timestamp = this.now().toISOString();
    const id = randomUUID();
    const booking = {
      ...input,
      id,
      onChainBookingId: BigInt(`0x${id.replaceAll("-", "").slice(0, 16)}`).toString(),
      state: "PENDING_FUNDING" as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (this.prisma) {
      return this.prisma.$transaction(async (database) => {
        const property = await database.property.findFirst({
          where: { slug: input.listingId, active: true, host: { address: input.host } },
          select: {
            id: true,
            hostId: true,
            slots: {
              where: { startsAt: new Date(input.visitTime), booking: null },
              take: 1,
              select: { id: true },
            },
          },
        });
        const slot = property?.slots[0];
        if (!property || !slot) {
          throw new Error("Approved property or available viewing slot not found");
        }
        const renter = await database.walletIdentity.upsert({
          where: { address: input.renter },
          update: { network: (process.env.STELLAR_NETWORK || "TESTNET").toUpperCase() },
          create: { address: input.renter, network: (process.env.STELLAR_NETWORK || "TESTNET").toUpperCase() },
          select: { id: true },
        });
        const stored = await database.booking.create({
          data: {
            id: booking.id,
            onChainBookingId: booking.onChainBookingId,
            propertyId: property.id,
            slotId: slot.id,
            renterId: renter.id,
            hostId: property.hostId,
            depositAmount: input.depositAmount,
            asset: "native",
            visitTime: new Date(input.visitTime),
            evidenceHash: input.evidenceHash,
            history: { create: { to: "PENDING_FUNDING", actor: input.renter } },
          },
          include: {
            property: { select: { slug: true } },
            renter: { select: { address: true } },
            host: { select: { address: true } },
            transactions: true,
          },
        });
        return this.fromDatabase(stored);
      }, { isolationLevel: "Serializable" });
    }
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async get(id: string): Promise<Booking> {
    if (this.prisma) {
      const stored = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          property: { select: { slug: true } },
          renter: { select: { address: true } },
          host: { select: { address: true } },
          transactions: true,
        },
      });
      if (!stored) throw new Error("Booking not found");
      return this.fromDatabase(stored);
    }
    const booking = this.bookings.get(id);
    if (!booking) throw new Error("Booking not found");
    return booking;
  }

  async fund(
    id: string,
    transactionHash: string,
    verification?: { ledger: number; confirmedAt: string },
  ): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.state !== "PENDING_FUNDING") throw new Error("Booking is not awaiting funding");
    this.assertHash(transactionHash);
    if (this.prisma) {
      if (!verification) throw new Error("Verified funding metadata is required");
      await this.prisma.$transaction(async (database) => {
        const updated = await database.booking.updateMany({
          where: { id, status: "PENDING_FUNDING" },
          data: { status: "FUNDED", version: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("Booking is not awaiting funding");
        await database.paymentTransaction.create({
          data: {
            bookingId: id,
            hash: transactionHash,
            kind: "FUND",
            amount: booking.depositAmount,
            ledger: verification.ledger,
            confirmedAt: new Date(verification.confirmedAt),
          },
        });
        await database.bookingStatusHistory.create({
          data: {
            bookingId: id,
            from: "PENDING_FUNDING",
            to: "FUNDED",
            actor: booking.renter,
            txHash: transactionHash,
          },
        });
      });
      return this.get(id);
    }
    return this.update(booking, { state: "FUNDED", fundingTransactionHash: transactionHash });
  }

  async checkIn(id: string, actor: string, proofHash: string): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.state !== "FUNDED") throw new Error("Booking must be funded");
    if (booking.renter !== actor) throw new Error("Only renter can check in");
    this.assertHash(proofHash);
    if (this.prisma) {
      const updated = await this.prisma.booking.updateMany({
        where: { id, status: "FUNDED", renter: { address: actor } },
        data: { status: "CHECKED_IN", checkInProofHash: proofHash, version: { increment: 1 } },
      });
      if (updated.count !== 1) throw new Error("Booking cannot be checked in");
      await this.prisma.bookingStatusHistory.create({
        data: { bookingId: id, from: "FUNDED", to: "CHECKED_IN", actor },
      });
      return this.get(id);
    }
    return this.update(booking, { state: "CHECKED_IN", checkInProofHash: proofHash });
  }

  async confirm(id: string, actor: string, transactionHash: string): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.state !== "CHECKED_IN") throw new Error("Renter must check in first");
    if (booking.host !== actor) throw new Error("Only host can confirm");
    this.assertHash(transactionHash);
    if (this.prisma) {
      const updated = await this.prisma.booking.updateMany({
        where: { id, status: "CHECKED_IN", host: { address: actor } },
        data: { status: "COMPLETED", version: { increment: 1 } },
      });
      if (updated.count !== 1) throw new Error("Booking cannot be confirmed");
      await this.prisma.bookingStatusHistory.create({
        data: {
          bookingId: id,
          from: "CHECKED_IN",
          to: "COMPLETED",
          actor,
          txHash: transactionHash,
        },
      });
      return this.get(id);
    }
    return this.update(booking, { state: "COMPLETED", settlementTransactionHash: transactionHash });
  }

  private assertHash(value: string): void {
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error("Invalid transaction or evidence hash");
  }

  private update(booking: Booking, changes: Partial<Booking>): Booking {
    Object.assign(booking, changes, { updatedAt: this.now().toISOString() });
    return booking;
  }

  private fromDatabase(stored: {
    id: string;
    onChainBookingId: string;
    property: { slug: string };
    renter: { address: string };
    host: { address: string };
    depositAmount: bigint;
    visitTime: Date;
    evidenceHash: string;
    checkInProofHash: string | null;
    status: BookingState;
    createdAt: Date;
    updatedAt: Date;
    transactions: Array<{ hash: string; kind: "FUND" | "REFUND" | "RELEASE" | "SPLIT" }>;
  }): Booking {
    return {
      id: stored.id,
      onChainBookingId: stored.onChainBookingId,
      listingId: stored.property.slug,
      renter: stored.renter.address,
      host: stored.host.address,
      depositAmount: stored.depositAmount,
      visitTime: stored.visitTime.toISOString(),
      evidenceHash: stored.evidenceHash,
      state: stored.status,
      checkInProofHash: stored.checkInProofHash ?? undefined,
      fundingTransactionHash: stored.transactions.find((value) => value.kind === "FUND")?.hash,
      settlementTransactionHash: stored.transactions.find((value) => value.kind !== "FUND")?.hash,
      createdAt: stored.createdAt.toISOString(),
      updatedAt: stored.updatedAt.toISOString(),
    };
  }
}
