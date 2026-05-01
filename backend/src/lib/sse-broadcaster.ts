import type { Response } from "express";

interface SseClient { res: Response; id: number; }

let nextId = 0;
const clients = new Map<number, SseClient>();

export function addSseClient(res: Response): () => void {
  const id = ++nextId;
  clients.set(id, { res, id });
  return () => clients.delete(id);
}

export function broadcast(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of clients) {
    try { client.res.write(payload); } catch { clients.delete(id); }
  }
}
