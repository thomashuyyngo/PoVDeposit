import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { BookingWorkflowService } from "./booking-workflow.service.js";

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
}).strict();

@Controller("api/bookings")
export class BookingController {
  constructor(private readonly bookings: BookingWorkflowService) {}

  @Post()
  create(@Body() body: unknown) {
    const input = createInput.safeParse(body);
    if (!input.success) throw new BadRequestException("Invalid booking request");
    try {
      return this.serialize(this.bookings.create({
        ...input.data,
        depositAmount: BigInt(input.data.depositAmount),
      }));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Booking rejected");
    }
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.serialize(this.bookings.get(id));
  }

  @Post(":id/fund")
  fund(@Param("id") id: string, @Body() body: unknown) {
    const input = transactionInput.parse(body);
    return this.serialize(this.bookings.fund(id, input.transactionHash));
  }

  @Post(":id/check-in")
  checkIn(@Param("id") id: string, @Body() body: unknown) {
    const input = actorProofInput.parse(body);
    return this.serialize(this.bookings.checkIn(id, input.actor, input.proofHash));
  }

  @Post(":id/confirm")
  confirm(@Param("id") id: string, @Body() body: unknown) {
    const input = actorProofInput.parse(body);
    return this.serialize(this.bookings.confirm(id, input.actor, input.proofHash));
  }

  private serialize<T extends { depositAmount: bigint }>(booking: T) {
    return { ...booking, depositAmount: booking.depositAmount.toString(), network: "TESTNET" as const };
  }
}
