import "dotenv/config";
import app from "./app.js";
import { pool } from "./db.js";
import { logger } from "./lib/logger.js";
import { loadBlockedIps } from "./lib/ip-blocklist.js";

const port = Number(process.env.PORT ?? 8080);

loadBlockedIps()
  .then(() => logger.info("Bloklangan IP lar yuklandi"))
  .catch((err) => logger.error({ err }, "Bloklangan IP larni yuklashda xatolik"));

const server = app.listen(port, () => {
  logger.info(`Server ishga tushdi → http://localhost:${port}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Oldin: graceful shutdown yo'q edi — SIGTERM/SIGINT kelganda jarayonlar uzilardi,
//        DB connection lar to'g'ri yopilmasdi, so'rov o'rtada to'xtab qolardi
async function shutdown(signal: string) {
  logger.info(`${signal} qabul qilindi — server to'xtatilmoqda...`);

  // Yangi so'rovlarni qabul qilishni to'xtat, mavjud so'rovlarni tugat
  server.close(async () => {
    logger.info("HTTP server yopildi");
    try {
      await pool.end();
      logger.info("DB connection pool yopildi");
    } catch (err) {
      logger.error({ err }, "DB pool yopishda xatolik");
    }
    process.exit(0);
  });

  // 10 soniya ichida yopilmasa, majburan to'xtat
  setTimeout(() => {
    logger.error("Graceful shutdown vaqti tugadi — majburan to'xtatildi");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Unhandled hatolar ───────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — server to'xtatilmoqda");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  // Crash qilmaymiz, faqat log qilamiz — Express 5 ushlab oladi
});