import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../src/body.js";

test("reads a small JSON request body", async () => {
  const request = (async function* () { yield Buffer.from('{"deposit":1}'); })();
  assert.deepEqual(await readJson(request), { deposit: 1 });
});

test("rejects an oversized request body", async () => {
  const request = (async function* () { yield Buffer.alloc(17); })();
  await assert.rejects(readJson(request, 16), /request body too large/);
});
