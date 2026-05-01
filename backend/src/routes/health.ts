import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// ─── GET /healthz — Liveness probe ──────────────────────────────────────────
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

// ─── GET /readyz — Readiness probe (DB bilan birga) ─────────────────────────
// Oldin: faqat server bor-yo'qligini tekshirardi, DB ulanishi tekshirilmadi
// Endi:  DB ga ham ping qilinadi — deploy vaqtida muammolar oldindan aniqlanadi
router.get("/readyz", async (_req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

export default router;