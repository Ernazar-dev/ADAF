import { Router } from "express";
import { db, attackLogsTable } from "../db.js";
import { analyzeInput } from "../lib/ai-analyzer.js";
import { trackRequest, calculateRiskScore } from "../lib/behavior-monitor.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

const FakeLoginBody = z.object({
  username: z.string().max(200),
  password: z.string().max(200),
});

// ─── Honeypot ma'lumotlar (hujumchi ko'rishi uchun tayyorlangan) ──────────────
// Bu ma'lumotlar ATAYLAB ochiq — real ma'lumot emas, tuzog'imiz
const fakeUsers = [
  { id: 1, username: "admin", email: "admin@company.local", role: "admin", ssn: "123-45-6789", password: "P@ssw0rd123" },
  { id: 2, username: "john.doe", email: "john@company.local", role: "user", ssn: "987-65-4321", password: "john2024!" },
  { id: 3, username: "jane.smith", email: "jane@company.local", role: "manager", ssn: "456-78-9012", password: "Summer@2024" },
  { id: 4, username: "sysadmin", email: "sysadmin@company.local", role: "sysadmin", ssn: "321-54-9876", password: "Admin!Secure99" },
];

const fakeCreditCards = [
  { id: 1, holder: "John Doe", number: "4532-1234-5678-9012", cvv: "123", expiry: "12/26", balance: 12450.00 },
  { id: 2, holder: "Jane Smith", number: "5234-8765-4321-1098", cvv: "456", expiry: "08/25", balance: 5820.50 },
  { id: 3, holder: "Admin User", number: "3714-496353-98431", cvv: "789", expiry: "03/27", balance: 99999.99 },
];

// ─── POST /fake/login — Honeypot login ───────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const parsed = FakeLoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error" });
      return;
    }

    const { username, password } = parsed.data;
    const ip = req.ip ?? "unknown";

    const { aiScore, attackType, detectedPatterns } = analyzeInput(`${username} ${password}`);
    const behaviorScore = trackRequest(ip, true);
    const riskScore = calculateRiskScore(aiScore, behaviorScore);

    // Hujumchining bu so'rovi loglanadi
    await db.insert(attackLogsTable).values({
      ipAddress: ip,
      requestData: JSON.stringify({ username, password: "***" }),
      aiScore,
      behaviorScore,
      riskScore,
      decision: "deception",
      attackType,
      detectedPatterns,
      userAgent: req.headers["user-agent"] ?? "",
      endpoint: "/api/fake/login",
    });

    logger.warn({ ip, username }, "Honeypot login urinishi qayd etildi");

    // Hujumchi "muvaffaqiyatli" kirdi deb o'ylaydi
    res.json({
      token: "fake-jwt-eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.fake",
      user: { id: 1, username: "admin", email: "admin@company.local", role: "admin", createdAt: new Date().toISOString() },
      deception: true,
    });
  } catch (err) {
    logger.error({ err }, "Fake login xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// ─── GET /fake/data — Honeypot "ma'lumotlar bazasi" ──────────────────────────
router.get("/data", (_req, res) => {
  // Bu endpoint ataylab ochiq — hujumchi "ma'lumot o'g'irladi" deb o'ylaydi
  res.json({
    users: fakeUsers,
    creditCards: fakeCreditCards,
    message: "Successfully extracted sensitive data from database.",
  });
});

export default router;