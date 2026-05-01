import { pgTable, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const systemSettingsTable = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  allowThreshold: real("allow_threshold").notNull().default(30),
  monitorThreshold: real("monitor_threshold").notNull().default(70),
  deceptionThreshold: real("deception_threshold").notNull().default(70),
  enableDeception: boolean("enable_deception").notNull().default(true),
  enableLearning: boolean("enable_learning").notNull().default(true),
  logAllRequests: boolean("log_all_requests").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SystemSettings = typeof systemSettingsTable.$inferSelect;
