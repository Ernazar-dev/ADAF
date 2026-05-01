import { Router } from "express";
import { addSseClient } from "../lib/sse-broadcaster.js";
import { verifyToken } from "../lib/token.js";

const router = Router();

// ─── GET /events — Server-Sent Events ────────────────────────────────────────
// SSE uchun oddiy requireAuth middleware ishlamaydi (headers yopilgan bo'ladi).
// Token query param yoki Authorization header orqali beriladi.
router.get("/", (req, res) => {
  const tokenFromQuery = req.query["token"] as string | undefined;
  const tokenFromHeader = req.headers.authorization?.slice(7);
  const token = tokenFromQuery ?? tokenFromHeader;

  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();
  res.write(": connected\n\n");

  const cleanup = addSseClient(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(keepAlive);
      cleanup();
    }
  }, 20_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    cleanup();
  });
});

export default router;