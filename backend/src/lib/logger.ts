import pino from "pino";
import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";

const isDev = process.env.NODE_ENV !== "production";

const LOG_DIR = join(process.cwd(), "logs");
const LOG_FILE = join(LOG_DIR, "adaf.log");

try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch {}

const fileStream = createWriteStream(LOG_FILE, { flags: "a" });

export const logger = pino(
  { level: isDev ? "debug" : "info" },
  pino.multistream([
    { stream: process.stdout,  level: isDev ? "debug" : "info" },
    { stream: fileStream,      level: "info" },
  ])
);
