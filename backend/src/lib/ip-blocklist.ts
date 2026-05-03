import { db } from "../db.js";
import { blockedIpsTable } from "../schema/blocked_ips.js";

const blockedSet = new Set<string>();

export function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/, "");
}

export async function loadBlockedIps(): Promise<void> {
  const rows = await db.select({ ipAddress: blockedIpsTable.ipAddress }).from(blockedIpsTable);
  blockedSet.clear();
  rows.forEach((r) => blockedSet.add(normalizeIp(r.ipAddress)));
}

export function isIpBlocked(ip: string): boolean {
  return blockedSet.has(normalizeIp(ip));
}

export function addToBlocklist(ip: string): void {
  blockedSet.add(normalizeIp(ip));
}

export function removeFromBlocklist(ip: string): void {
  blockedSet.delete(normalizeIp(ip));
}
