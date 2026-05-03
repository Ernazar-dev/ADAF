import type { Response } from "express";

interface SseClient { res: Response; id: number; ip: string; }

let nextId = 0;
const clients = new Map<number, SseClient>();

export function addSseClient(res: Response, ip: string): () => void {
  const id = ++nextId;
  clients.set(id, { res, id, ip });
  return () => clients.delete(id);
}

// Barcha ulangan clientlarga broadcast
export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of clients) {
    try { client.res.write(payload); } catch { clients.delete(id); }
  }
}

// Faqat muayyan IP dagi clientlarga broadcast (IP bloklash uchun)
export function broadcastToIp(targetIp: string, event: string, data: unknown): void {
  const norm = targetIp.replace(/^::ffff:/, "");
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of clients) {
    if (client.ip === norm) {
      try { client.res.write(payload); } catch { clients.delete(id); }
    }
  }
}
