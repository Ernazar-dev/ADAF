import { Request, Response, NextFunction } from "express";
import { isIpBlocked, normalizeIp } from "../lib/ip-blocklist.js";

export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction): void {
  // app.set("trust proxy", 1) tufayli req.ip Render proxy orqasidagi haqiqiy IP ni qaytaradi
  const raw = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const ip = normalizeIp(raw);
  if (isIpBlocked(ip)) {
    res.status(403).json({ error: "ip_blocked", message: "Ruxsat etilmagan" });
    return;
  }
  next();
}
