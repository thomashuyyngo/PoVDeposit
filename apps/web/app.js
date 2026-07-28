export function xlmToStroops(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Deposit must be greater than 0 XLM");
  const stroops = Math.round(amount * 10_000_000);
  if (!Number.isSafeInteger(stroops)) throw new Error("Deposit is too large");
  return stroops;
}

export async function createBooking({ renter, host, depositXlm }, fetchFn = fetch) {
  const response = await fetchFn("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ renter: renter.trim(), host: host.trim(), deposit: xlmToStroops(depositXlm) }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Booking request failed");
  return body;
}
