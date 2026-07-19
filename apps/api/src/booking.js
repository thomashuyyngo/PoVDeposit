export function createBookingIntent({ renter, host, deposit }) {
  if (!renter || !host || !Number.isInteger(deposit) || deposit <= 0) {
    return {
      status: 422,
      body: { error: "renter, host, and positive deposit are required" },
    };
  }

  return {
    status: 201,
    body: { renter, host, deposit, state: "PENDING_FUNDING" },
  };
}
