import { Router } from "express";
import { db, attackLogsTable, sessionsTable, systemSettingsTable } from "../db.js";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { analyzeInput } from "../lib/ai-analyzer.js";
import { trackRequest, calculateDecision, calculateRiskScore } from "../lib/behavior-monitor.js";
import { broadcast } from "../lib/sse-broadcaster.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── Validatsiya ─────────────────────────────────────────────────────────────
const AnalyzeBody = z.object({
  input: z.string().max(10_000, "Input 10,000 belgidan oshmasligi kerak"),
  ip: z.string().ip({ version: "v4" }).or(z.string().ip({ version: "v6" })).or(z.string().max(45)),
  userAgent: z.string().max(500),
  endpoint: z.string().max(200),
});

// ─── Yordamchi: settings olish ───────────────────────────────────────────────
async function getSettings() {
  const [s] = await db.select().from(systemSettingsTable).limit(1);
  return s ?? {
    allowThreshold: 30,
    deceptionThreshold: 70,
    enableDeception: true,
    logAllRequests: false,
  };
}

// ─── Yordamchi: session atomic upsert ────────────────────────────────────────
// KRITIK BUG FIX: Avvalgi kod db.$with("cte").as(...) ni requestCount ga
// o'zlashtirardi — bu drizzle-orm da mavjud emas, runtime crash qiladi.
// To'g'risi: SQL level da atomic increment — race condition yo'q.
async function upsertSession(ip: string, isSuspicious: boolean, riskLevel: string) {
  await db
    .insert(sessionsTable)
    .values({
      ipAddress: ip,
      requestCount: 1,
      lastSeen: new Date(),
      isSuspicious,
      riskLevel,
    })
    .onConflictDoUpdate({
      target: sessionsTable.ipAddress,
      set: {
        // SQL level increment — atomic, race condition yo'q
        requestCount: sql`${sessionsTable.requestCount} + 1`,
        lastSeen: new Date(),
        // Bir marta suspicious bo'lsa, tozalanmaydi
        isSuspicious: sql`${sessionsTable.isSuspicious} OR ${isSuspicious}`,
        riskLevel,
      },
    });
}

// ─── POST /analyze ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const parsed = AnalyzeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "validation_error",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { input, ip, userAgent, endpoint } = parsed.data;
    const settings = await getSettings();

    // 1. AI tahlili
    const { aiScore, attackType, detectedPatterns } = analyzeInput(input);

    // 2. Xulq-atvor tahlili
    const behaviorScore = trackRequest(ip, aiScore > 30);

    // 3. Umumiy risk va qaror
    const riskScore = calculateRiskScore(aiScore, behaviorScore);
    const decision = calculateDecision(
      aiScore,
      behaviorScore,
      settings.allowThreshold,
      settings.deceptionThreshold
    );

    // 4. Loglash (shartli)
    const shouldLog =
      settings.logAllRequests || decision !== "allow" || aiScore > 0;

    let logId = 0;
    if (shouldLog) {
      const [log] = await db
        .insert(attackLogsTable)
        .values({
          ipAddress: ip,
          requestData: input,
          aiScore,
          behaviorScore,
          riskScore,
          decision,
          attackType,
          detectedPatterns,
          userAgent,
          endpoint,
        })
        .returning({ id: attackLogsTable.id });

      logId = log?.id ?? 0;

      // SSE orqali real-time xabar
      if (decision !== "allow" || aiScore > 0) {
        broadcast("new-attack", {
          id: logId,
          ipAddress: ip,
          attackType,
          riskScore,
          decision,
          aiScore,
          behaviorScore,
          detectedPatterns,
          endpoint,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 5. Session yangilash (atomic upsert)
    const isSuspicious = decision !== "allow";
    const riskLevel =
      riskScore >= 70 ? "high" : riskScore >= 30 ? "medium" : "low";
    await upsertSession(ip, isSuspicious, riskLevel);

    res.json({ aiScore, behaviorScore, riskScore, decision, attackType, detectedPatterns, logId });
  } catch (err) {
    logger.error({ err }, "Analyze xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;