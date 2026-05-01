import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSSE } from "../hooks/useSSE";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAttacksQueryKey, getGetStatsSummaryQueryKey, getGetStatsByHourQueryKey, getGetStatsByTypeQueryKey } from "./api";
import { useAuth } from "./auth";

export interface LiveAttack { id: number; ipAddress: string; attackType: string; riskScore: number; decision: string; createdAt: string; }
interface LiveContextValue { liveCount: number; liveAttacks: LiveAttack[]; clearCount: () => void; }
const LiveContext = createContext<LiveContextValue>({ liveCount: 0, liveAttacks: [], clearCount: () => {} });

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount]   = useState(0);
  const [liveAttacks, setLiveAttacks] = useState<LiveAttack[]>([]);

  // BUG FIX: useAuth() dan reaktiv holda olamiz — getAuthToken() statik edi, o'zgarishlarni ko'rmasdi
  const { token, isDeception } = useAuth();
  const sseEnabled = Boolean(token) && !isDeception;

  const handleNewAttack = useCallback((data: unknown) => {
    const attack = data as LiveAttack;
    setLiveCount((c) => c + 1);
    setLiveAttacks((prev) => [attack, ...prev].slice(0, 5));
    queryClient.invalidateQueries({ queryKey: getGetAttacksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsByHourQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsByTypeQueryKey() });
  }, [queryClient]);

  useSSE("new-attack", handleNewAttack, sseEnabled);

  useEffect(() => {
    if (liveCount > 0) { const t = setTimeout(() => setLiveCount(0), 8000); return () => clearTimeout(t); }
  }, [liveCount]);

  const clearCount = useCallback(() => setLiveCount(0), []);
  return <LiveContext.Provider value={{ liveCount, liveAttacks, clearCount }}>{children}</LiveContext.Provider>;
}
export function useLive() { return useContext(LiveContext); }