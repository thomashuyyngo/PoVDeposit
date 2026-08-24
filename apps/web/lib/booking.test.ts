import { describe, expect, it } from "vitest";
import { actionLabel, availableActions, type Booking } from "./booking";

const booking: Booking = {
  id: "booking-1",
  onChainBookingId: "42",
  listingId: "modern-apartment",
  renter: "GRENTER",
  host: "GHOST",
  depositAmount: "5000000",
  visitTime: "2026-07-29T10:00:00.000Z",
  state: "FUNDED",
  network: "PUBLIC",
};

describe("availableActions", () => {
  it("offers nothing without a connected wallet", () => {
    expect(availableActions(booking, null)).toEqual([]);
  });

  it("lets a funded renter check in or cancel", () => {
    expect(availableActions(booking, "GRENTER")).toEqual(["check-in", "cancel"]);
  });

  it("lets the host issue the check-in code on a funded booking", () => {
    expect(availableActions(booking, "GHOST")).toEqual(["issue-challenge"]);
  });

  it("lets only the host release a checked-in deposit", () => {
    const checkedIn = { ...booking, state: "CHECKED_IN" } as Booking;
    expect(availableActions(checkedIn, "GHOST")).toEqual(["confirm"]);
    expect(availableActions(checkedIn, "GRENTER")).toEqual([]);
  });

  it("offers nothing once the escrow has settled", () => {
    for (const state of ["COMPLETED", "REFUNDED", "CANCELLED", "EXPIRED"] as const) {
      expect(availableActions({ ...booking, state }, "GRENTER")).toEqual([]);
      expect(availableActions({ ...booking, state }, "GHOST")).toEqual([]);
    }
  });

  it("ignores a wallet that is neither party", () => {
    expect(availableActions(booking, "GSTRANGER")).toEqual([]);
  });
});

describe("actionLabel", () => {
  it("says what each action does to the deposit", () => {
    expect(actionLabel("issue-challenge")).toMatch(/code/i);
    expect(actionLabel("check-in")).toMatch(/check-in/i);
    expect(actionLabel("confirm")).toMatch(/release/i);
    expect(actionLabel("cancel")).toMatch(/refund/i);
  });
});
