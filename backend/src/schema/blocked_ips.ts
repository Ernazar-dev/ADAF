import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const blockedIpsTable = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason").notNull().default("Manual block"),
  blockedAt: timestamp("blocked_at").notNull().defaultNow(),
});

export type BlockedIp = typeof blockedIpsTable.$inferSelect;
