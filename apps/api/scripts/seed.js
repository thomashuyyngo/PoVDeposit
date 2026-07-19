import pg from "pg";

const { Pool } = pg;
const actor = "GB7CDHVP6LBMP3L5BJFXSTOWB4NX7ONPFN4537AFCWCNL7YD2MHSBZJN";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await pool.query(
  "INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT DO NOTHING",
  [actor],
);
for (const role of ["RENTER", "HOST", "ARBITRATOR"]) {
  await pool.query(
    "INSERT INTO user_roles (wallet_address, role) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [actor, role],
  );
}

await pool.end();
console.log("D8 seed complete");
