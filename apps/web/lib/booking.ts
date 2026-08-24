export type BookingState =
  | "PENDING_FUNDING"
  | "FUNDED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "RELEASED"
  | "EXPIRED";

export type Booking = {
  id: string;
  onChainBookingId: string;
  listingId: string;
  renter: string;
  host: string;
  depositAmount: string;
  visitTime: string;
  state: BookingState;
  network: string;
  checkInProofHash?: string;
  fundingTransactionHash?: string;
  settlementTransactionHash?: string;
};

export type BookingAction = "issue-challenge" | "check-in" | "confirm" | "cancel";

export type CheckInChallenge = { token: string; expiresAt: string };

/** The host issues the challenge at the property; the renter has two minutes to use it. */
export async function requestCheckInChallenge(id: string, actor: string): Promise<CheckInChallenge> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(id)}/check-in-challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actor }),
  });
  const payload = await response.json().catch(() => ({})) as CheckInChallenge & { message?: string };
  if (!response.ok) throw new Error(payload.message || `Could not issue a challenge (HTTP ${response.status})`);
  return payload;
}

/**
 * The escrow only allows one move per state, and only by one of the two parties.
 * Deciding it here keeps the buttons honest: a host is never offered a refund the
 * contract would reject, and a renter is never offered to release their own deposit.
 */
export function availableActions(booking: Booking, wallet: string | null): BookingAction[] {
  if (!wallet) return [];
  const isRenter = wallet === booking.renter;
  const isHost = wallet === booking.host;

  if (booking.state === "FUNDED") {
    if (isRenter) return ["check-in", "cancel"];
    if (isHost) return ["issue-challenge"];
    return [];
  }
  if (booking.state === "CHECKED_IN" && isHost) return ["confirm"];
  return [];
}

export function actionLabel(action: BookingAction): string {
  if (action === "issue-challenge") return "Show the check-in code";
  if (action === "check-in") return "Record check-in";
  if (action === "confirm") return "Confirm visit and release deposit";
  return "Cancel and refund deposit";
}

export async function fetchBooking(id: string): Promise<Booking> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`);
  const payload = await response.json().catch(() => ({})) as Booking & { message?: string };
  // Show what the server said. "Booking not found" tells someone to check the
  // reference; "HTTP 500" only tells them something broke.
  if (!response.ok) throw new Error(payload.message || `Could not load the booking (HTTP ${response.status})`);
  return payload;
}

export async function postBookingAction(
  id: string,
  action: BookingAction,
  body: Record<string, string>,
): Promise<Booking> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as Booking & { message?: string };
  if (!response.ok) throw new Error(payload.message || `Request failed with HTTP ${response.status}`);
  return payload;
}
