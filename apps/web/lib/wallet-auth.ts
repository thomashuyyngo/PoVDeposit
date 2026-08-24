export type AuthChallenge = {
  id: string;
  message: string;
  expiresAt: string;
  network: string;
};

export type SignedMessage = {
  signedMessage: unknown;
  signerAddress?: string;
  error?: unknown;
};

/**
 * Freighter v3 hands back raw signature bytes and v4 hands back base64, so the
 * value is normalised here. The API only accepts base64, and sending bytes would
 * fail verification with a message that blames the signature rather than the shape.
 */
export function toBase64Signature(signed: unknown): string {
  if (typeof signed === "string") return signed;
  if (signed instanceof Uint8Array) return bytesToBase64(signed);
  if (signed instanceof ArrayBuffer) return bytesToBase64(new Uint8Array(signed));
  if (Array.isArray(signed) && signed.every((byte) => Number.isInteger(byte))) {
    return bytesToBase64(Uint8Array.from(signed as number[]));
  }
  // Node Buffers cross the bridge as { type: "Buffer", data: number[] }.
  if (signed && typeof signed === "object" && "data" in signed) {
    const { data } = signed as { data: unknown };
    if (Array.isArray(data)) return bytesToBase64(Uint8Array.from(data as number[]));
  }
  throw new Error("Freighter returned a signature in an unsupported format");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(payload.message || `Request failed with HTTP ${response.status}`);
  return payload as T;
}

export function requestChallenge(address: string): Promise<AuthChallenge> {
  return postJson<AuthChallenge>("/api/auth/challenge", { address });
}

export function submitSignature(input: {
  challengeId: string;
  address: string;
  signature: string;
}): Promise<{ address: string }> {
  return postJson<{ address: string }>("/api/auth/verify", input);
}
