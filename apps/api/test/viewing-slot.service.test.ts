import { describe, expect, it } from "vitest";
import { ViewingSlotService } from "../src/property/viewing-slot.service.js";

describe("ViewingSlotService", () => {
  it("rejects overlapping slots for one property", () => {
    const service = new ViewingSlotService(() => new Date("2026-07-28T10:00:00Z"));
    service.create("property-1", "GHOST", "2026-07-29T10:00:00Z", "2026-07-29T10:30:00Z");
    expect(() => service.create(
      "property-1",
      "GHOST",
      "2026-07-29T10:15:00Z",
      "2026-07-29T10:45:00Z",
    )).toThrow("Viewing slot overlaps an existing slot");
  });

  it("allows only one active reservation and releases an expired lock", () => {
    let now = new Date("2026-07-28T10:00:00Z");
    const service = new ViewingSlotService(() => now);
    const slot = service.create("property-1", "GHOST", "2026-07-29T10:00:00Z", "2026-07-29T10:30:00Z");
    expect(service.reserve(slot.id, "GRENTER1").reservedBy).toBe("GRENTER1");
    expect(() => service.reserve(slot.id, "GRENTER2")).toThrow("Viewing slot is temporarily reserved");
    now = new Date("2026-07-28T10:06:00Z");
    expect(service.reserve(slot.id, "GRENTER2").reservedBy).toBe("GRENTER2");
    service.confirm(slot.id, "GRENTER2", "booking-2");
    expect(() => service.reserve(slot.id, "GRENTER3")).toThrow("Viewing slot is already booked");
  });
});
