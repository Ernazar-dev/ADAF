import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/token.js";

export interface AuthRequest extends Request {
  user?: { id: number; username: string; fake: boolean };
}

/**
 * Standart auth middleware — faqat REAL tokenlar o'tadi.
 * Fake (honeypot) tokenlar 401 bilan qaytariladi.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Token talab qilinadi" });
    return;
  }

  const token = authHeader.slice(7);
  // allowFake = false → fake tokenlar bu yerdan o'ta olmaydi
  const payload = verifyToken(token, false);

  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Token yaroqsiz yoki muddati o'tgan" });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Honeypot middleware — FAQAT fake tokenlar o'tadi.
 * /api/fake/* endpointlari uchun.
 */
export function requireFakeAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  // allowFake = true → fake tokenlar ham o'tadi
  const payload = verifyToken(token, true);

  if (!payload) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  req.user = payload;
  next();
}