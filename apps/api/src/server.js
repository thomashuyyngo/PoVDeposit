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
const webRoot = join(dirname(fileURLToPath(import.meta.url)), "../../web/index.html");

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
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return response.end(await readFile(webRoot));
  } catch {
    response.writeHead(503, { "content-type": "application/json" });
    return response.end(JSON.stringify({ error: "service unavailable" }));
  }
}).listen(Number(process.env.PORT || 3000));
