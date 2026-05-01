import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { logger } from "./lib/logger.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL .env faylida topilmadi");
}

// Oldin: pool sozlamalari yo'q edi — default 10 connection, timeout yo'q
// Endi:  production uchun mos sozlamalar
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maksimal connection soni
  idleTimeoutMillis: 30_000,  // 30s bekor turgan connection yopiladi
  connectionTimeoutMillis: 5_000, // 5s ichida ulanolmasa — xatolik
});

// Pool xatolarini global ushlash (process crash dan saqlaydi)
pool.on("error", (err) => {
  logger.error({ err }, "PostgreSQL pool xatoligi");
});

export const db = drizzle(pool, { schema });

export * from "./schema/index.js";