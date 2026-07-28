export function checkInSecret(environment: NodeJS.ProcessEnv): Buffer {
  const secret = environment.CHECKIN_TOKEN_SECRET || environment.SESSION_SECRET;
  if (secret) return Buffer.from(secret);
  if (environment.NODE_ENV === "production") {
    throw new Error("CHECKIN_TOKEN_SECRET or SESSION_SECRET is required in production");
  }
  return Buffer.from("development-only-checkin-secret");
}
