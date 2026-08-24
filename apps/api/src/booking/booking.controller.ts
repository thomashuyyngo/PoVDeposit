import { createHash } from "node:crypto";
import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { BookingWorkflowService } from "./booking-workflow.service.js";
import { CheckInChallengeService } from "../checkin/check-in-challenge.service.js";
import { ContractTransactionVerifier } from "../stellar/contract-transaction-verifier.js";
import type { StellarSettings } from "../config/stellar.config.js";
import { STELLAR_SETTINGS } from "../config/stellar.tokens.js";

const createInput = z.object({
  listingId: z.string().min(1).max(100),
  renter: z.string().min(1).max(100),
  host: z.string().min(1).max(100),
  depositAmount: z.string().regex(/^[1-9]\d{0,19}$/),
  visitTime: z.iso.datetime(),
  evidenceHash: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

const transactionInput = z.object({
  transactionHash: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

// Check-in is the one step the escrow contract has no call for: it moves no funds.
// Presence is proved instead by a short-lived challenge the host issues at the
// property, which the renter has two minutes to hand back.
const actorInput = z.object({
  actor: z.string().min(1).max(100),
}).strict();

const actorTokenInput = z.object({
  actor: z.string().min(1).max(100),
  token: z.string().min(1).max(2048),
}).strict();

const actorTransactionInput = z.object({
  actor: z.string().min(1).max(100),
  transactionHash: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

@Controller("api/bookings")
export class BookingController {
  constructor(
    private readonly bookings: BookingWorkflowService,
    private readonly transactions: ContractTransactionVerifier,
    @Inject(STELLAR_SETTINGS) private readonly stellar: StellarSettings,
    private readonly checkInChallenges: CheckInChallengeService,
  ) {}

  /**
   * The workflow signals a missing booking with a plain Error, which Nest reports as
   * 500. A mistyped reference is the caller's, so it is answered as one.
   */
  private async requireBooking(id: string) {
    try {
      return await this.bookings.get(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Booking not found";
      if (/not found/i.test(message)) throw new NotFoundException(message);
      throw error;
    }
  }

  @Get("activity/recent")
  async activity() {
    return (await this.bookings.activity()).map((booking) => this.serialize(booking));
  }

  @Post()
  async create(@Body() body: unknown) {
    const input = createInput.safeParse(body);
    if (!input.success) throw new BadRequestException("Invalid booking request");
    try {
      return this.serialize(await this.bookings.create({
        ...input.data,
        depositAmount: BigInt(input.data.depositAmount),
      }));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Booking rejected");
    }
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.serialize(await this.requireBooking(id));
  }

  @Post(":id/fund")
  async fund(@Param("id") id: string, @Body() body: unknown) {
    const input = transactionInput.parse(body);
    const booking = await this.requireBooking(id);
    const verification = await this.transactions.verifyFunding(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.fund(id, input.transactionHash, verification));
  }

  @Post(":id/cancel")
  async cancel(@Param("id") id: string, @Body() body: unknown) {
    const input = actorTransactionInput.parse(body);
    const booking = await this.requireBooking(id);
    const verification = await this.transactions.verifyRefund(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.refund(id, input.actor, input.transactionHash, verification));
  }

  @Post(":id/check-in-challenge")
  async checkInChallenge(@Param("id") id: string, @Body() body: unknown) {
    const input = actorInput.parse(body);
    const booking = await this.requireBooking(id);
    if (booking.host !== input.actor) throw new ForbiddenException("Only the host can issue a check-in challenge");
    const { token, payload } = await this.checkInChallenges.issue(id, booking.renter);
    return { token, expiresAt: payload.expiresAt };
  }

  @Post(":id/check-in")
  async checkIn(@Param("id") id: string, @Body() body: unknown) {
    const input = actorTokenInput.parse(body);
    let nonce: string;
    try {
      ({ nonce } = await this.checkInChallenges.consume(input.token, id, input.actor));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Check-in challenge rejected");
    }
    // The recorded proof is the hash of a nonce that existed for two minutes and
    // can never be replayed, so the record stands for presence rather than intent.
    const proofHash = createHash("sha256").update(nonce).digest("hex");
    return this.serialize(await this.bookings.checkIn(id, input.actor, proofHash));
  }

  @Post(":id/confirm")
  async confirm(@Param("id") id: string, @Body() body: unknown) {
    const input = actorTransactionInput.parse(body);
    const booking = await this.requireBooking(id);
    await this.transactions.verifySettlement(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.confirm(id, input.actor, input.transactionHash));
  }

  private serialize<T extends { depositAmount: bigint }>(booking: T) {
    return { ...booking, depositAmount: booking.depositAmount.toString(), network: this.stellar.network };
  }
}
