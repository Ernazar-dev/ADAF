import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSSE } from "../hooks/useSSE";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAttacksQueryKey,
  getGetStatsSummaryQueryKey,
  getGetStatsByHourQueryKey,
  getGetStatsByTypeQueryKey,
  getGetBlockedIpsQueryKey,
  getSseUrl,
} from "./api";
import { useAuth } from "./auth";
import { removeAuthToken, removeIsDeception } from "./auth";

export interface LiveAttack {
  id: number; ipAddress: string; attackType: string;
  riskScore: number; decision: string; createdAt: string;
}
interface LiveContextValue {
  liveCount: number; liveAttacks: LiveAttack[]; clearCount: () => void;
}
const LiveContext = createContext<LiveContextValue>({
  liveCount: 0, liveAttacks: [], clearCount: () => {},
});

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount]     = useState(0);
  const [liveAttacks, setLiveAttacks] = useState<LiveAttack[]>([]);

  const { token, isDeception } = useAuth();

  // new-attack: faqat haqiqiy admin uchun
  const attackSseEnabled = Boolean(token) && !isDeception;

  const handleNewAttack = useCallback((data: unknown) => {
    const attack = data as LiveAttack;
    setLiveCount((c) => c + 1);
    setLiveAttacks((prev) => [attack, ...prev].slice(0, 5));
    queryClient.invalidateQueries({ queryKey: getGetAttacksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsByHourQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsByTypeQueryKey() });
  }, [queryClient]);

  useSSE("new-attack", handleNewAttack, attackSseEnabled);

  // blocked_ips_updated: admin panel ro'yxatini yangilash
  const handleBlockedUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetBlockedIpsQueryKey() });
  }, [queryClient]);
  useSSE("blocked_ips_updated", handleBlockedUpdated, attackSseEnabled);

  // ip_blocked: hamma login qilgan foydalanuvchilar uchun (fake dashboard ham)
  // Bu event kelganda DARHOL /blocked sahifasiga o'tkazamiz
  useEffect(() => {
    if (!token) return;

    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function connect() {
      if (closed) return;
      es = new EventSource(getSseUrl());

      es.addEventListener("ip_blocked", () => {
        // Tokenlarni tozala va bloklash sahifasiga o'tkazish
        removeAuthToken();
        removeIsDeception();
        window.location.replace("/blocked");
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (!closed) retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [token]);

  useEffect(() => {
    if (liveCount > 0) {
      const t = setTimeout(() => setLiveCount(0), 8000);
      return () => clearTimeout(t);
    }
  }, [liveCount]);

  const clearCount = useCallback(() => setLiveCount(0), []);

  return (
    <LiveContext.Provider value={{ liveCount, liveAttacks, clearCount }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() { return useContext(LiveContext); }
