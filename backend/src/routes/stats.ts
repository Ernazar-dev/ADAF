import { Router } from "express";
import { db, attackLogsTable } from "../db.js";
import { sql, count, desc } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── GET /stats/summary ───────────────────────────────────────────────────────
router.get("/summary", async (_req, res) => {
  try {
    // Parallel so'rovlar — ketma-ket emas, bir vaqtda bajariladi (tezroq)
    const [
      [{ totalAttacks }],
      [{ todayAttacks }],
      [{ blockedAttacks }],  // BUG FIX: deception + monitor (oldin faqat deception edi)
      [{ deceived }],
      [{ allowed }],
      [{ monitoredSessions }],
      topTypeResult,
      riskResult,
    ] = await Promise.all([
      db.select({ totalAttacks: count() }).from(attackLogsTable),

      db.select({ todayAttacks: count() }).from(attackLogsTable)
        .where(sql`${attackLogsTable.createdAt} >= NOW() - INTERVAL '1 day'`),

      // Bloklangan = honeypot GA YO'NALTIRILGAN + monitor ostidagi
      db.select({ blockedAttacks: count() }).from(attackLogsTable)
        .where(sql`${attackLogsTable.decision} IN ('deception', 'monitor')`),

      // Deceived = faqat honeypot ga yuborilganlar
      db.select({ deceived: count() }).from(attackLogsTable)
        .where(sql`${attackLogsTable.decision} = 'deception'`),

      db.select({ allowed: count() }).from(attackLogsTable)
        .where(sql`${attackLogsTable.decision} = 'allow'`),

      db.select({ monitoredSessions: count() }).from(attackLogsTable)
        .where(sql`${attackLogsTable.decision} = 'monitor'`),

      db.select({ attackType: attackLogsTable.attackType, cnt: count() })
        .from(attackLogsTable)
        .where(sql`${attackLogsTable.attackType} != 'Clean'`)
        .groupBy(attackLogsTable.attackType)
        .orderBy(desc(count()))
        .limit(1),

      db.select({ avg: sql<number>`COALESCE(AVG(${attackLogsTable.riskScore}), 0)` })
        .from(attackLogsTable),
    ]);

    res.json({
      totalAttacks: Number(totalAttacks),
      todayAttacks: Number(todayAttacks),
      blockedAttacks: Number(blockedAttacks),
      monitoredSessions: Number(monitoredSessions),
      deceived: Number(deceived),
      allowed: Number(allowed),
      topAttackType: topTypeResult[0]?.attackType ?? "None",
      riskScore: Math.round(Number(riskResult[0]?.avg ?? 0) * 10) / 10,
    });
  } catch (err) {
    logger.error({ err }, "Stats summary xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /stats/by-type ───────────────────────────────────────────────────────
router.get("/by-type", async (_req, res) => {
  try {
    const [[{ total }], byType] = await Promise.all([
      db.select({ total: count() }).from(attackLogsTable),
      db.select({ type: attackLogsTable.attackType, count: count() })
        .from(attackLogsTable)
        .groupBy(attackLogsTable.attackType)
        .orderBy(desc(count())),
    ]);

    const totalNum = Number(total) || 1;
    res.json(
      byType.map((r) => ({
        type: r.type,
        count: Number(r.count),
        percentage: Math.round((Number(r.count) / totalNum) * 1000) / 10,
      }))
    );
  } catch (err) {
    logger.error({ err }, "Stats by-type xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /stats/by-hour ───────────────────────────────────────────────────────
router.get("/by-hour", async (_req, res) => {
  try {
    const rows = await db
      .select({
        hour: sql<string>`TO_CHAR(DATE_TRUNC('hour', ${attackLogsTable.createdAt}), 'HH24:MI')`,
        count: count(),
        sqlInjection: sql<number>`COUNT(*) FILTER (WHERE ${attackLogsTable.attackType} = 'SQL Injection')`,
        xss: sql<number>`COUNT(*) FILTER (WHERE ${attackLogsTable.attackType} = 'XSS')`,
      })
      .from(attackLogsTable)
      .where(sql`${attackLogsTable.createdAt} >= NOW() - INTERVAL '24 hours'`)
      .groupBy(sql`DATE_TRUNC('hour', ${attackLogsTable.createdAt})`)
      .orderBy(sql`DATE_TRUNC('hour', ${attackLogsTable.createdAt})`);

    res.json(
      rows.map((r) => ({
        hour: r.hour,
        count: Number(r.count),
        sqlInjection: Number(r.sqlInjection),
        xss: Number(r.xss),
        other: Math.max(0, Number(r.count) - Number(r.sqlInjection) - Number(r.xss)),
      }))
    );
  } catch (err) {
    logger.error({ err }, "Stats by-hour xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /stats/recent ───────────────────────────────────────────────────────
router.get("/recent", async (_req, res) => {
  try {
    const data = await db
      .select()
      .from(attackLogsTable)
      .orderBy(desc(attackLogsTable.createdAt))
      .limit(10);

    res.json(
      data.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        detectedPatterns: l.detectedPatterns as string[],
      }))
    );
  } catch (err) {
    logger.error({ err }, "Stats recent xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;