import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { inlineScriptHashes } from "../src/security/csp-hashes.js";

describe("inlineScriptHashes", () => {
  it("allows only exact inline scripts emitted by Next", () => {
    const script = "self.__next_f.push([1])";
    const hash = `'sha256-${createHash("sha256").update(script).digest("base64")}'`;
    expect(inlineScriptHashes([`<script>${script}</script><script src="/app.js"></script>`]))
      .toEqual([hash]);
  });
});
