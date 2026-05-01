import { Router } from "express";
import { db, blockedIpsTable } from "../db.js";
import { eq, desc } from "drizzle-orm";
import { addToBlocklist, removeFromBlocklist, normalizeIp } from "../lib/ip-blocklist.js";
import { logger } from "../lib/logger.js";

const router = Router();

// GET /blocked-ips — barcha bloklangan IP lar
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(blockedIpsTable)
      .orderBy(desc(blockedIpsTable.blockedAt));
    res.json(rows.map((r) => ({ ...r, blockedAt: r.blockedAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "BlockedIps GET xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// POST /blocked-ips — IP bloklash
router.post("/", async (req, res) => {
  try {
    const body = req.body as { ip?: string; reason?: string };
    const ip = normalizeIp(body.ip?.trim() ?? "");
    if (!ip) {
      res.status(400).json({ error: "ip_required" });
      return;
    }

    const [existing] = await db
      .select({ id: blockedIpsTable.id })
      .from(blockedIpsTable)
      .where(eq(blockedIpsTable.ipAddress, ip))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "already_blocked" });
      return;
    }

    const [row] = await db
      .insert(blockedIpsTable)
      .values({ ipAddress: ip, reason: body.reason ?? "Manual block" })
      .returning();

    addToBlocklist(ip);
    logger.info({ ip }, "IP bloklandi");
    res.json({ ...row, blockedAt: row!.blockedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "BlockedIps POST xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

// DELETE /blocked-ips/:ip — blokdan chiqarish
router.delete("/:ip", async (req, res) => {
  try {
    const ip = normalizeIp(decodeURIComponent(req.params["ip"] ?? ""));
    await db.delete(blockedIpsTable).where(eq(blockedIpsTable.ipAddress, ip));
    removeFromBlocklist(ip);
    logger.info({ ip }, "IP blokdan chiqarildi");
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "BlockedIps DELETE xatoligi");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
