import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

await copyFile(
  fileURLToPath(import.meta.resolve("@stellar/freighter-api")),
  new URL("../../web/freighter-api.js", import.meta.url),
);
