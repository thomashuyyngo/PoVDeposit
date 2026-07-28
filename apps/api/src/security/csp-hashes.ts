import { createHash } from "node:crypto";

export function inlineScriptHashes(htmlDocuments: string[]): string[] {
  const hashes = new Set<string>();
  for (const html of htmlDocuments) {
    for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      const script = match[1];
      if (script) hashes.add(`'sha256-${createHash("sha256").update(script).digest("base64")}'`);
    }
  }
  return [...hashes];
}
