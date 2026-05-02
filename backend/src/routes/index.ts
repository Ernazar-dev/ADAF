import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import analyzeRouter from "./analyze.js";
import attacksRouter from "./attacks.js";
import statsRouter from "./stats.js";
import sessionsRouter from "./sessions.js";
import settingsRouter from "./settings.js";
import fakeRouter from "./fake.js";
import eventsRouter from "./events.js";
import blockedIpsRouter from "./blocked-ips.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { ipBlockMiddleware } from "../middleware/ipBlock.js";

const router = Router();

// ─── IP bloklashdan ozod: monitoring va admin boshqaruvi ─────────────────────
// Health: Render monitoring uchun har doim ochiq
// blocked-ips: admin IP ni bloklashdan chiqara olsin (requireAuth himoya qiladi)
router.use(healthRouter);
router.use("/blocked-ips", requireAuth, blockedIpsRouter);

// ─── IP bloklash: qolgan barcha endpointlar ───────────────────────────────────
// Bloklangan IP bu qatordan pastdagi hech bir routga kira olmaydi
router.use(ipBlockMiddleware);

// ─── Ochiq (login va honeypot) ────────────────────────────────────────────────
router.use("/events", eventsRouter);
router.use("/auth", authRouter);
router.use("/fake", fakeRouter);

// ─── Himoyalangan endpoint'lar (token talab qilinadi) ────────────────────────
router.use("/analyze", requireAuth, analyzeRouter);
router.use("/attacks", requireAuth, attacksRouter);
router.use("/stats", requireAuth, statsRouter);
router.use("/sessions", requireAuth, sessionsRouter);
router.use("/settings", requireAuth, settingsRouter);

export default router;