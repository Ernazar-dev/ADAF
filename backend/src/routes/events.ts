import { Router } from "express";
import { addSseClient } from "../lib/sse-broadcaster.js";
import { verifyToken } from "../lib/token.js";

const router = Router();

router.get("/", (req, res) => {
  const tokenFromQuery  = req.query["token"] as string | undefined;
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

  // Client'ning haqiqiy IP sini saqlaymiz — IP bloklash uchun kerak
  const clientIp = (req.ip ?? req.socket.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
  const cleanup = addSseClient(res, clientIp);

  const keepAlive = setInterval(() => {
    try { res.write(": ping\n\n"); }
    catch { clearInterval(keepAlive); cleanup(); }
  }, 5_000);

  req.on("close", () => { clearInterval(keepAlive); cleanup(); });
});

export default router;
