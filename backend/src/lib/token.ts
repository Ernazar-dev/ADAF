import crypto from "crypto";

const TOKEN_SECRET = process.env.SESSION_SECRET ?? "adaf-secret-key-CHANGE-IN-PRODUCTION";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

function signToken(payload: object): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function generateToken(userId: number, username: string): string {
  // fake: false — real token belgisi
  return signToken({ id: userId, username, fake: false, exp: Date.now() + TOKEN_TTL_MS });
}

export function generateFakeToken(username: string): string {
  // fake: true — honeypot token belgisi
  return signToken({ id: 9999, username, fake: true, exp: Date.now() + TOKEN_TTL_MS });
}

export interface TokenPayload {
  id: number;
  username: string;
  fake: boolean;
}

/**
 * Token tekshiruvi.
 * @param token    - JWT-like token string
 * @param allowFake - true: fake tokenlar ham o'tadi (honeypot endpointlar uchun)
 *                    false (default): faqat real tokenlar o'tadi
 */
export function verifyToken(token: string, allowFake = false): TokenPayload | null {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const payloadB64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    // Timing-safe taqqoslash
    const expectedSig = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;

    // MUHIM: fake token real endpointga kira olmasin
    if (payload.fake === true && !allowFake) return null;

    return {
      id: Number(payload.id),
      username: String(payload.username),
      fake: Boolean(payload.fake),
    };
  } catch {
    return null;
  }
}

/** Faqat fake token ekanligini tekshiradi (honeypot route uchun) */
export function isFakeToken(token: string): boolean {
  const payload = verifyToken(token, true);
  return payload?.fake === true;
}