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

// ─── Ochiq (auth talab qilmaydigan) endpoint'lar ─────────────────────────────

router.use("/events", eventsRouter);
router.use(healthRouter);

// Bloklangan IP lar /auth va /fake ga kira olmaydi
router.use("/auth", ipBlockMiddleware, authRouter);
router.use("/fake", ipBlockMiddleware, fakeRouter);

// ─── Himoyalangan endpoint'lar (token talab qilinadi) ────────────────────────
router.use("/analyze", requireAuth, analyzeRouter);
router.use("/attacks", requireAuth, attacksRouter);
router.use("/stats", requireAuth, statsRouter);
router.use("/sessions", requireAuth, sessionsRouter);
router.use("/settings", requireAuth, settingsRouter);
router.use("/blocked-ips", requireAuth, blockedIpsRouter);

export default router;