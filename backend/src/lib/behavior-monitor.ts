// ─── In-memory IP tracking (behaviour analysis) ──────────────────────────────
// Not: Bu production da Redis ga ko'chirilishi tavsiya qilinadi.
//      Hozircha memory da — restart qilsa ma'lumot yo'qoladi.

interface IpRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  attackCount: number;
}

const ipMap = new Map<string, IpRecord>();
const WINDOW_MS = 60 * 1_000;            // 1 daqiqa oyna
const HIGH_RATE_THRESHOLD = 30;          // 30 so'rov/daqiqa dan oshsa shubhali
const ATTACK_HISTORY_THRESHOLD = 3;      // 3 hujum yozuvi — behavior score oshadi

// ─── Memory leak tuzatildi ────────────────────────────────────────────────────
// Oldin: ipMap cheksiz o'sardi — eski yozuvlar hech qachon o'chirilmaydi
// Endi:  har 5 daqiqada muddati o'tgan yozuvlar tozalanadi
const CLEANUP_INTERVAL_MS = 5 * 60 * 1_000;

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [ip, record] of ipMap.entries()) {
    if (now - record.lastSeen > WINDOW_MS * 2) {
      ipMap.delete(ip);
      removed++;
    }
  }
  if (removed > 0) {
    // Silent cleanup — production logni ortiqcha to'ldirmasin
  }
}, CLEANUP_INTERVAL_MS);

// .unref() — bu interval server to'xtashiga to'sqinlik qilmasin
cleanupInterval.unref();

// ─── IP tracking ─────────────────────────────────────────────────────────────
export function trackRequest(ip: string, isAttack = false): number {
  const now = Date.now();
  const record = ipMap.get(ip);

  // Yangi IP yoki window muddati o'tgan
  if (!record || now - record.firstSeen > WINDOW_MS) {
    ipMap.set(ip, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      attackCount: isAttack ? 1 : 0,
    });
    return 0;
  }

  record.count++;
  record.lastSeen = now;
  if (isAttack) record.attackCount++;

  let score = 0;
  if (record.count > HIGH_RATE_THRESHOLD) {
    score += Math.min((record.count - HIGH_RATE_THRESHOLD) * 2, 50);
  }
  if (record.attackCount >= ATTACK_HISTORY_THRESHOLD) {
    score += Math.min(record.attackCount * 10, 50);
  }

  return Math.min(score, 100);
}

// ─── Qaror qabul qilish ───────────────────────────────────────────────────────
export function calculateDecision(
  aiScore: number,
  behaviorScore: number,
  allowThreshold: number,
  deceptionThreshold: number
): "allow" | "monitor" | "deception" {
  const riskScore = aiScore * 0.6 + behaviorScore * 0.4;
  if (riskScore >= deceptionThreshold) return "deception";
  if (riskScore >= allowThreshold) return "monitor";
  return "allow";
}

// ─── Risk hisoblash ───────────────────────────────────────────────────────────
export function calculateRiskScore(aiScore: number, behaviorScore: number): number {
  return Math.round(aiScore * 0.6 + behaviorScore * 0.4);
}