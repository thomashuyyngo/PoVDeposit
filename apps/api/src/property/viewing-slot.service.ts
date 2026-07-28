import { randomUUID } from "node:crypto";
import { Inject, Injectable, Optional } from "@nestjs/common";

type ViewingSlot = {
  id: string;
  propertyId: string;
  host: string;
  startsAt: string;
  endsAt: string;
  reservedBy?: string;
  lockedUntil?: string;
  bookingId?: string;
};

export const SLOT_CLOCK = Symbol("SLOT_CLOCK");

@Injectable()
export class ViewingSlotService {
  private readonly slots = new Map<string, ViewingSlot>();

  constructor(
    @Optional() @Inject(SLOT_CLOCK) private readonly now: () => Date = () => new Date(),
  ) {}

  create(propertyId: string, host: string, startsAt: string, endsAt: string): ViewingSlot {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (start <= this.now() || end <= start) throw new Error("Invalid viewing slot window");
    const overlap = [...this.slots.values()].some((slot) =>
      slot.propertyId === propertyId
      && start < new Date(slot.endsAt)
      && end > new Date(slot.startsAt));
    if (overlap) throw new Error("Viewing slot overlaps an existing slot");
    const slot = { id: randomUUID(), propertyId, host, startsAt: start.toISOString(), endsAt: end.toISOString() };
    this.slots.set(slot.id, slot);
    return slot;
  }

  reserve(id: string, renter: string): ViewingSlot {
    const slot = this.get(id);
    if (slot.bookingId) throw new Error("Viewing slot is already booked");
    if (slot.lockedUntil && new Date(slot.lockedUntil) > this.now() && slot.reservedBy !== renter) {
      throw new Error("Viewing slot is temporarily reserved");
    }
    slot.reservedBy = renter;
    slot.lockedUntil = new Date(this.now().getTime() + 5 * 60_000).toISOString();
    return slot;
  }

  confirm(id: string, renter: string, bookingId: string): ViewingSlot {
    const slot = this.get(id);
    if (slot.bookingId) throw new Error("Viewing slot is already booked");
    if (slot.reservedBy !== renter || !slot.lockedUntil || new Date(slot.lockedUntil) <= this.now()) {
      throw new Error("Viewing slot reservation expired");
    }
    slot.bookingId = bookingId;
    slot.lockedUntil = undefined;
    return slot;
  }

  private get(id: string): ViewingSlot {
    const slot = this.slots.get(id);
    if (!slot) throw new Error("Viewing slot not found");
    return slot;
  }
}
