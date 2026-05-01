import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Oldin: pino-pretty har doim yoqilgan edi — production da sekin va JSON emas
// Endi:  production da toza JSON log (parsing uchun qulay), dev da pretty
export const logger = pino(
  isDev
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: { colorize: true, ignore: "pid,hostname" },
        },
      }
    : {
        level: "info",
      }
);