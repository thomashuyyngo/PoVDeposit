import { describe, expect, it } from "vitest";
import { toBase64Signature } from "./wallet-auth";

const bytes = Uint8Array.from([222, 173, 190, 239]);
const expected = "3q2+7w==";

describe("toBase64Signature", () => {
  it("passes a base64 string through unchanged", () => {
    expect(toBase64Signature(expected)).toBe(expected);
  });

  it("encodes the raw bytes Freighter v3 returns", () => {
    expect(toBase64Signature(bytes)).toBe(expected);
  });

  it("encodes an ArrayBuffer", () => {
    expect(toBase64Signature(bytes.buffer)).toBe(expected);
  });

  it("encodes a serialized Node Buffer", () => {
    expect(toBase64Signature({ type: "Buffer", data: [222, 173, 190, 239] })).toBe(expected);
  });

  it("encodes a plain byte array", () => {
    expect(toBase64Signature([222, 173, 190, 239])).toBe(expected);
  });

  it("refuses a shape it cannot encode instead of sending nonsense", () => {
    expect(() => toBase64Signature(null)).toThrow(/unsupported format/);
    expect(() => toBase64Signature({ signature: "x" })).toThrow(/unsupported format/);
  });
});
