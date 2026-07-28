import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import pg from "pg";
import { readJson } from "./body.js";
import { health } from "./health.js";
import { persistBookingIntent } from "./booking.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const webDir = join(dirname(fileURLToPath(import.meta.url)), "../../web");
const webRoot = join(webDir, "index.html");
const freighterApiPath = fileURLToPath(import.meta.resolve("@stellar/freighter-api"));

createServer(async (request, response) => {
  try {
    if (request.url === "/health") {
      await pool.query("SELECT 1");
      response.writeHead(200, { "content-type": "application/json" });
      return response.end(JSON.stringify(health()));
    }
    if (request.method === "POST" && request.url === "/api/bookings") {
      const result = await persistBookingIntent(pool, await readJson(request));
      response.writeHead(result.status, { "content-type": "application/json" });
      return response.end(JSON.stringify(result.body));
    }
    if (request.url === "/wallet.js") {
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      return response.end(await readFile(join(webDir, "wallet.js")));
    }
    if (request.url === "/app.js") {
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      return response.end(await readFile(join(webDir, "app.js")));
    }
    if (request.url === "/freighter-api.js") {
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" });
      return response.end(await readFile(freighterApiPath));
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return response.end(await readFile(webRoot));
  } catch {
    response.writeHead(503, { "content-type": "application/json" });
    return response.end(JSON.stringify({ error: "service unavailable" }));
  }
}).listen(Number(process.env.PORT || 3000));
