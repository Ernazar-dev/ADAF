// ─────────────────────────────────────────────────────────────────────────────
// seed.mjs — Admin foydalanuvchisini bazaga qo'shish
//
// MUHIM: Bu fayl auth.ts dagi hashPassword() bilan SINXRON bo'lishi kerak!
// auth.ts → PBKDF2 (100_000 iteratsiya, sha512)
// Oldin seed.mjs → SHA-256 edi — admin hech qachon login bo'la olmasdi!
// ─────────────────────────────────────────────────────────────────────────────

import { config } from "dotenv";
import { pbkdf2Sync } from "crypto";
import pg from "pg";

config({ path: ".env" });

const { Pool } = pg;

// ─── Tekshiruvlar ─────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("❌ XATO: DATABASE_URL .env faylida topilmadi!");
  process.exit(1);
}

const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error("❌ XATO: ADMIN_PASSWORD .env faylida topilmadi!");
  console.error("   .env fayliga qo'shing: ADMIN_PASSWORD=YourStrongPassword123!");
  process.exit(1);
}

if (adminPassword.length < 8) {
  console.error("❌ XATO: ADMIN_PASSWORD kamida 8 ta belgi bo'lishi kerak!");
  process.exit(1);
}

// ─── Parol hashing (auth.ts bilan bir xil algoritm!) ─────────────────────────
const HASH_SALT = process.env.HASH_SALT ?? "adaf_salt_2024";

function hashPassword(password) {
  // BUG FIX: createHash("sha256") o'rniga pbkdf2Sync — auth.ts bilan mos
  return pbkdf2Sync(password, HASH_SALT, 100_000, 64, "sha512").toString("hex");
}

// ─── DB operatsiyasi ──────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const passwordHash = hashPassword(adminPassword);
  const email = `${adminUsername}@adaf.local`;

  await pool.query(
    `INSERT INTO users (username, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, 'admin', NOW())
     ON CONFLICT (username) DO UPDATE SET password_hash = $3, email = $2`,
    [adminUsername, email, passwordHash]
  );

  console.log("✅ Admin foydalanuvchi muvaffaqiyatli yaratildi!");
  console.log(`   Username : ${adminUsername}`);
  console.log(`   Password : ${adminPassword}`);
  console.log(`   Email    : ${email}`);
  console.log(`   Hash alg : PBKDF2-SHA512 (100,000 iterations)`);
} catch (err) {
  console.error("❌ XATO:", err.message);
  if (err.code === "42P01") {
    console.error("   Jadval mavjud emas. Avval: npm run db:push");
  }
  process.exit(1);
} finally {
  await pool.end();
}
