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

export async function persistBookingIntent(pool, input) {
  const intent = createBookingIntent(input);
  if (intent.status !== 201) return intent;

  const result = await pool.query(
    `INSERT INTO booking_intents (renter_wallet, host_wallet, deposit_atomic)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [intent.body.renter, intent.body.host, intent.body.deposit],
  );
  return { ...intent, body: { ...intent.body, id: result.rows[0].id } };
}
