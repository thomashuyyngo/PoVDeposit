import { randomUUID } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";

export type BookingState =
  | "PENDING_FUNDING"
  | "FUNDED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "REFUNDED"
  | "RELEASED"
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
  ) {}

  create(input: CreateBooking): Booking {
    if (input.renter === input.host) throw new Error("Renter and host must differ");
    if (input.depositAmount <= 0n || input.depositAmount > 100_000_000_000n) {
      throw new Error("Deposit amount out of bounds");
    }
    if (new Date(input.visitTime) <= this.now()) throw new Error("Visit time must be in the future");
    if (!/^[a-f0-9]{64}$/i.test(input.evidenceHash)) throw new Error("Invalid evidence hash");
    const timestamp = this.now().toISOString();
    const booking = {
      ...input,
      id: randomUUID(),
      state: "PENDING_FUNDING" as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  get(id: string): Booking {
    const booking = this.bookings.get(id);
    if (!booking) throw new Error("Booking not found");
    return booking;
  }

  fund(id: string, transactionHash: string): Booking {
    const booking = this.get(id);
    if (booking.state !== "PENDING_FUNDING") throw new Error("Booking is not awaiting funding");
    this.assertHash(transactionHash);
    return this.update(booking, { state: "FUNDED", fundingTransactionHash: transactionHash });
  }

  checkIn(id: string, actor: string, proofHash: string): Booking {
    const booking = this.get(id);
    if (booking.state !== "FUNDED") throw new Error("Booking must be funded");
    if (booking.renter !== actor) throw new Error("Only renter can check in");
    this.assertHash(proofHash);
    return this.update(booking, { state: "CHECKED_IN", checkInProofHash: proofHash });
  }

  confirm(id: string, actor: string, transactionHash: string): Booking {
    const booking = this.get(id);
    if (booking.state !== "CHECKED_IN") throw new Error("Renter must check in first");
    if (booking.host !== actor) throw new Error("Only host can confirm");
    this.assertHash(transactionHash);
    return this.update(booking, { state: "COMPLETED", settlementTransactionHash: transactionHash });
  }

  private assertHash(value: string): void {
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error("Invalid transaction or evidence hash");
  }

  private update(booking: Booking, changes: Partial<Booking>): Booking {
    Object.assign(booking, changes, { updatedAt: this.now().toISOString() });
    return booking;
  }
}
