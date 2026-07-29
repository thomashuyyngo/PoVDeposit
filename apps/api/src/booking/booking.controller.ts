import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { BookingWorkflowService } from "./booking-workflow.service.js";
import { ContractTransactionVerifier } from "../stellar/contract-transaction-verifier.js";

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

const actorProofInput = z.object({
  actor: z.string().min(1).max(100),
  proofHash: z.string().regex(/^[a-f0-9]{64}$/i),
  transactionHash: z.string().regex(/^[a-f0-9]{64}$/i),
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
  ) {}

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
    return this.serialize(await this.bookings.get(id));
  }

  @Post(":id/fund")
  async fund(@Param("id") id: string, @Body() body: unknown) {
    const input = transactionInput.parse(body);
    const booking = await this.bookings.get(id);
    const verification = await this.transactions.verifyFunding(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.fund(id, input.transactionHash, verification));
  }

  @Post(":id/cancel")
  async cancel(@Param("id") id: string, @Body() body: unknown) {
    const input = actorTransactionInput.parse(body);
    const booking = await this.bookings.get(id);
    const verification = await this.transactions.verifyRefund(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.refund(id, input.actor, input.transactionHash, verification));
  }

  @Post(":id/check-in")
  async checkIn(@Param("id") id: string, @Body() body: unknown) {
    const input = actorProofInput.parse(body);
    const booking = await this.bookings.get(id);
    await this.transactions.verifyCheckIn(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.checkIn(id, input.actor, input.proofHash));
  }

  @Post(":id/confirm")
  async confirm(@Param("id") id: string, @Body() body: unknown) {
    const input = actorTransactionInput.parse(body);
    const booking = await this.bookings.get(id);
    await this.transactions.verifySettlement(input.transactionHash, booking.onChainBookingId);
    return this.serialize(await this.bookings.confirm(id, input.actor, input.transactionHash));
  }

  private serialize<T extends { depositAmount: bigint }>(booking: T) {
    return { ...booking, depositAmount: booking.depositAmount.toString(), network: "PUBLIC" };
  }
}
