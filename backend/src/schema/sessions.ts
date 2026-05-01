import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  requestCount: integer("request_count").notNull().default(0),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  isSuspicious: boolean("is_suspicious").notNull().default(false),
  riskLevel: text("risk_level").notNull().default("low"),
});

export type Session = typeof sessionsTable.$inferSelect;
