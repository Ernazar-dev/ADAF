import { Router } from "express";
import { db, attackLogsTable } from "../db.js";
import { eq, desc, ilike, and, count } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── GET /attacks?page=1&limit=20&type=...&decision=...&search=... ───────────
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] ?? 1));
    // Oldin: limit chegarasi yo'q edi — ?limit=999999 bilan DB ni to'xtatish mumkin edi
    const limit = Math.min(Math.max(1, Number(req.query["limit"] ?? 20)), 100);
    const type = req.query["type"] as string | undefined;
    const decision = req.query["decision"] as string | undefined;
    const search = req.query["search"] as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (type) conditions.push(eq(attackLogsTable.attackType, type));
    if (decision) conditions.push(eq(attackLogsTable.decision, decision));
    if (search) conditions.push(ilike(attackLogsTable.requestData, `%${search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [[{ total }], data] = await Promise.all([
      db.select({ total: count() }).from(attackLogsTable).where(where),
      db.select().from(attackLogsTable)
        .where(where)
        .orderBy(desc(attackLogsTable.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    res.json({
      data: data.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        detectedPatterns: l.detectedPatterns as string[],
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    logger.error({ err }, "Attacks GET xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /attacks/:id ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "invalid_id" });
      return;
    }

    const [log] = await db
      .select()
      .from(attackLogsTable)
      .where(eq(attackLogsTable.id, id))
      .limit(1);

    if (!log) { res.status(404).json({ error: "not_found" }); return; }

    res.json({
      ...log,
      createdAt: log.createdAt.toISOString(),
      detectedPatterns: log.detectedPatterns as string[],
    });
  } catch (err) {
    logger.error({ err }, "Attack GET/:id xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── DELETE /attacks/:id ──────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "invalid_id" });
      return;
    }

    await db.delete(attackLogsTable).where(eq(attackLogsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Attack DELETE xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;