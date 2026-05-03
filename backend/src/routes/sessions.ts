import { Router } from "express";
import { db, sessionsTable } from "../db.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── GET /sessions ────────────────────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(sessionsTable)
      .orderBy(desc(sessionsTable.lastSeen));

    res.json(
      data.map((s) => ({
        ...s,
        firstSeen: s.firstSeen.toISOString(),
        lastSeen: s.lastSeen.toISOString(),
      }))
    );
  } catch (err) {
    logger.error({ err }, "Sessions GET xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /sessions/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "invalid_id" });
      return;
    }

    await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Sessions DELETE xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;