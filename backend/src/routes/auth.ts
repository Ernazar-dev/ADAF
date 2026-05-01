import { Router } from "express";
import crypto from "crypto";
import { db, usersTable, attackLogsTable } from "../db.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { generateToken, generateFakeToken, verifyToken } from "../lib/token.js";
import { analyzeInput } from "../lib/ai-analyzer.js";

const router = Router();

const LoginBody = z.object({
  username: z.string().min(1).max(100).trim(),
  password: z.string().min(1).max(200),
});

const HASH_SALT = process.env.HASH_SALT ?? "adaf_salt_2024";

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, HASH_SALT, 100_000, 64, "sha512").toString("hex");
}

// ─── Hujum belgilari ──────────────────────────────────────────────────────────
const ATTACK_CHARS = /[<>'\";|`$(){}=\\/%]/;
const ATTACK_KEYWORDS = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|EXEC|EXECUTE|SLEEP|BENCHMARK|LOAD_FILE|script|alert|onerror|onload|onclick|javascript|vbscript|document|window|eval|whoami|passwd|shadow|system32)\b/i;

function hasAttackSignals(text: string): boolean {
  return ATTACK_CHARS.test(text) || ATTACK_KEYWORDS.test(text);
}

function detectAttack(username: string, password: string): {
  isAttack: boolean;
  aiScore: number;
  attackType: string;
  detectedPatterns: string[];
} {
  const uResult = analyzeInput(username);
  const pResult = analyzeInput(password);
  const dominant = uResult.aiScore >= pResult.aiScore ? uResult : pResult;
  const dominantText = uResult.aiScore >= pResult.aiScore ? username : password;

  const allPatterns = [...uResult.detectedPatterns, ...pResult.detectedPatterns]
    .filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);

  const regexFound = dominant.detectionMethod === "regex" || dominant.detectionMethod === "hybrid";
  const mlOnlyAttack =
    !regexFound &&
    dominant.aiScore >= 65 &&
    dominant.attackType !== "Clean" &&
    hasAttackSignals(dominantText);

  return {
    isAttack: regexFound || mlOnlyAttack,
    aiScore: dominant.aiScore,
    attackType: dominant.attackType,
    detectedPatterns: allPatterns,
  };
}

// ─── Rate limiting (in-memory) ────────────────────────────────────────────────
interface RateEntry {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}
const loginAttempts = new Map<string, RateEntry>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_NORMAL_ATTEMPTS = 5;  // Normal login: 5 urinish
const MAX_ATTACK_ATTEMPTS = 3;  // Hujum: 3 urinish

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    const cutoff = entry.lockedUntil ? entry.lockedUntil + RATE_WINDOW_MS : entry.firstAttempt + RATE_WINDOW_MS;
    if (now > cutoff) loginAttempts.delete(key);
  }
}, 5 * 60 * 1000).unref();

function incrementAttempt(key: string, max: number): { blocked: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttempt > RATE_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return { blocked: false };
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  entry.count++;
  if (entry.count >= max) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return { blocked: true, retryAfter: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { blocked: false };
}

function checkBlocked(key: string): { blocked: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry) return { blocked: false };
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { blocked: false };
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error" });
      return;
    }

    const { username, password } = parsed.data;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ?? "unknown";

    const detection = detectAttack(username, password);

    // ─── Hujum aniqlandi ───────────────────────────────────────────────────
    if (detection.isAttack) {

      // Hujum rate limit
      const attackKey = `attack:${ip}`;
      const attackBlocked = checkBlocked(attackKey);

      if (attackBlocked.blocked) {
        // Bloklangan — lekin hujumchi bilmasin, honeypot token bering
        // (real tizim kabi ko'rinadi, faqat token ishlamaydi)
        await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
        res.json({
          token: generateFakeToken(username),
          user: { id: 1, username: "m.hartwell", email: "m.hartwell@nexacore-fin.com", role: "admin", createdAt: new Date().toISOString() },
          deception: true,   // ← MUHIM: frontend uchun, hujumchi devtools ko'radi
        });
        return;
      }

      incrementAttempt(attackKey, MAX_ATTACK_ATTEMPTS);

      logger.warn(
        { ip, username, attackType: detection.attackType, score: detection.aiScore },
        "Login sahifasida hujum aniqlandi"
      );

      // Attack logini asinxron yozish (javobni kechiktirmasin)
      db.insert(attackLogsTable).values({
        ipAddress: ip,
        requestData: JSON.stringify({ username, password: "***" }),
        aiScore: detection.aiScore,
        behaviorScore: 0,
        riskScore: detection.aiScore,
        decision: "deception",
        attackType: detection.attackType,
        detectedPatterns: detection.detectedPatterns,
        userAgent: req.headers["user-agent"] ?? "",
        endpoint: "/api/auth/login",
      }).catch((e) => logger.error({ e }, "Attack log yozishda xato"));

      // Timing normallashtirish (real login kabi ko'rinsin)
      await new Promise(r => setTimeout(r, 200 + Math.random() * 150));

      // BUG FIX: deception: true — frontend /fake-dashboard ga yuboradi
      // Avvalgi auth-v2.ts da bu field yo'q edi, shuning uchun real dashboardga o'tib ketardi!
      res.json({
        token: generateFakeToken(username),
        user: {
          id: 1,
          username: "m.hartwell",
          email: "m.hartwell@nexacore-fin.com",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
        deception: true,   // ← BU FIELD SHART! frontend routing uchun
      });
      return;
    }

    // ─── Normal login ──────────────────────────────────────────────────────
    const normalKey = `normal:${ip}`;
    const normalBlocked = checkBlocked(normalKey);

    if (normalBlocked.blocked) {
      res.status(429).json({
        error: "too_many_requests",
        message: "Too many failed attempts. Please try again later.",
        retryAfter: normalBlocked.retryAfter,
      });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db
      .select().from(usersTable)
      .where(eq(usersTable.username, username)).limit(1);

    if (!user || user.passwordHash !== passwordHash) {
      // Muvaffaqiyatsiz urinish — count oshirish
      incrementAttempt(normalKey, MAX_NORMAL_ATTEMPTS);

      res.status(401).json({
        error: "unauthorized",
        message: "Username yoki parol noto'g'ri",
      });
      return;
    }

    // Muvaffaqiyatli login — blockni tozalash
    loginAttempts.delete(normalKey);

    logger.info({ userId: user.id, username: user.username }, "Muvaffaqiyatli login");

    res.json({
      token: generateToken(user.id, user.username),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      deception: false,   // ← BU FIELD SHART! frontend /dashboard ga yuboradi
    });
  } catch (err) {
    logger.error({ err }, "Login xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/logout", (_req, res) => { res.json({ success: true }); });

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

    // allowFake = false: fake token /me endpointdan o'ta olmaydi
    const payload = verifyToken(token, false);
    if (!payload) { res.status(401).json({ error: "unauthorized" }); return; }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, payload.id)).limit(1);
    if (!user) { res.status(401).json({ error: "unauthorized" }); return; }

    res.json({
      id: user.id, username: user.username,
      email: user.email, role: user.role,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "/me xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;