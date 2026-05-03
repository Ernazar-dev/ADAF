import { Router } from "express";
import { db, systemSettingsTable } from "../db.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── Validatsiya ─────────────────────────────────────────────────────────────
const UpdateBody = z.object({
  allowThreshold: z.number().min(0).max(100).optional(),
  monitorThreshold: z.number().min(0).max(100).optional(),
  deceptionThreshold: z.number().min(0).max(100).optional(),
  enableDeception: z.boolean().optional(),
  enableLearning: z.boolean().optional(),
  logAllRequests: z.boolean().optional(),
});

// ─── Yordamchi: birinchi yozuvni olish yoki yaratish ─────────────────────────
async function getOrCreate() {
  const [s] = await db.select().from(systemSettingsTable).limit(1);
  if (s) return s;

  const [created] = await db
    .insert(systemSettingsTable)
    .values({
      allowThreshold: 30,
      monitorThreshold: 70,
      deceptionThreshold: 70,
      enableDeception: true,
      enableLearning: true,
      logAllRequests: false,
    })
    .returning();

  return created!;
}

// ─── GET /settings ────────────────────────────────────────────────────────────
router.get("/", async (_req, res) => {
  try {
    const s = await getOrCreate();
    res.json({ ...s, updatedAt: s.updatedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Settings GET xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── PUT /settings ────────────────────────────────────────────────────────────
router.put("/", async (req, res) => {
  try {
    const parsed = UpdateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existing = await getOrCreate();
    const [updated] = await db
      .update(systemSettingsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(systemSettingsTable.id, existing.id))
      .returning();

    const result = updated ?? existing;
    res.json({ ...result, updatedAt: result.updatedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Settings PUT xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;