import { pgTable, serial, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const attackLogsTable = pgTable("attack_logs", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  requestData: text("request_data").notNull(),
  aiScore: real("ai_score").notNull().default(0),
  behaviorScore: real("behavior_score").notNull().default(0),
  riskScore: real("risk_score").notNull().default(0),
  decision: text("decision").notNull().default("allow"),
  attackType: text("attack_type").notNull().default("Clean"),
  detectedPatterns: jsonb("detected_patterns").$type<string[]>().notNull().default([]),
  userAgent: text("user_agent").notNull().default(""),
  endpoint: text("endpoint").notNull().default("/"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AttackLog = typeof attackLogsTable.$inferSelect;
