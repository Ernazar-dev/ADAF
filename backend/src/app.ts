import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

// Render/proxy orqasida ishlaydi — X-Forwarded-For dan haqiqiy IP olinadi
app.set("trust proxy", 1);

// ─── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} ruxsat etilmagan`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Xavfsizlik headerları ───────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

// ─── Routlar ─────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "Bu endpoint mavjud emas" });
});

// ─── Global xato handler ─────────────────────────────────────────────────────
// Express body-parser "type" xususiyatini Error ga qo'shadi, lekin bu
// standart TypeScript Error type ida yo'q — shuning uchun unknown cast kerak.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as Record<string, unknown>;
  const message = typeof error["message"] === "string" ? error["message"] : "Ichki server xatoligi";
  const errType = typeof error["type"] === "string" ? error["type"] : "";

  logger.error({ err }, "Server xatoligi");

  if (message.startsWith("CORS:")) {
    res.status(403).json({ error: "cors_error", message });
    return;
  }

  if (errType === "entity.parse.failed") {
    res.status(400).json({ error: "invalid_json", message: "JSON formatida xatolik" });
    return;
  }

  if (errType === "entity.too.large") {
    res.status(413).json({ error: "payload_too_large", message: "So'rov hajmi juda katta (max 512kb)" });
    return;
  }

  res.status(500).json({ error: "server_error", message });
});

export default app;