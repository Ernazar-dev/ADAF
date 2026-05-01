import { useQuery, useMutation } from "@tanstack/react-query";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
function getToken(): string | null { return localStorage.getItem("adaf_token"); }
async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: "network_error" })); throw err; }
  return res.json();
}
export const getGetStatsSummaryQueryKey = () => ["stats", "summary"] as const;
export const getGetStatsByTypeQueryKey  = () => ["stats", "by-type"] as const;
export const getGetStatsByHourQueryKey  = () => ["stats", "by-hour"] as const;
export const getGetAttacksQueryKey      = (p?: object) => ["attacks", p] as const;
export const getGetMeQueryKey           = () => ["me"] as const;
export const getGetSessionsQueryKey     = () => ["sessions"] as const;
export const getGetSettingsQueryKey     = () => ["settings"] as const;
export const getGetFakeDataQueryKey     = () => ["fake", "data"] as const;
export function useGetStatsSummary(o?: { query?: object }) { return useQuery<any>({ queryKey: getGetStatsSummaryQueryKey(), queryFn: () => apiFetch("/api/stats/summary"), ...(o?.query ?? {}) }); }
export function useGetStatsByType(o?: { query?: object }) { return useQuery<any[]>({ queryKey: getGetStatsByTypeQueryKey(), queryFn: () => apiFetch("/api/stats/by-type"), ...(o?.query ?? {}) }); }
export function useGetStatsByHour(o?: { query?: object }) { return useQuery<any[]>({ queryKey: getGetStatsByHourQueryKey(), queryFn: () => apiFetch("/api/stats/by-hour"), ...(o?.query ?? {}) }); }
export function useGetAttacks(params?: { page?: number; limit?: number; type?: string; decision?: string; search?: string }, o?: { query?: object }) {
  const sp = new URLSearchParams();
  if (params?.page)     sp.set("page",     String(params.page));
  if (params?.limit)    sp.set("limit",    String(params.limit));
  if (params?.type)     sp.set("type",     params.type);
  if (params?.decision) sp.set("decision", params.decision);
  if (params?.search)   sp.set("search",   params.search);
  const qs = sp.toString();
  return useQuery<any>({ queryKey: getGetAttacksQueryKey(params), queryFn: () => apiFetch(`/api/attacks${qs ? "?" + qs : ""}`), ...(o?.query ?? {}) });
}
export function useDeleteAttack() { return useMutation<any, Error, { id: number }>({ mutationFn: ({ id }) => apiFetch(`/api/attacks/${id}`, { method: "DELETE" }) }); }
export function useGetMe(o?: { query?: object }) { return useQuery<any>({ queryKey: getGetMeQueryKey(), queryFn: () => apiFetch("/api/auth/me"), ...(o?.query ?? {}) }); }
export function useLogin() { return useMutation<any, Error, { data: { username: string; password: string } }>({ mutationFn: ({ data }) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(data) }) }); }
export function useLogout() { return useMutation<any, Error, undefined>({ mutationFn: () => apiFetch("/api/auth/logout", { method: "POST" }) }); }
export function useAnalyzeRequest() { return useMutation<any, Error, { data: { input: string; ip: string; userAgent: string; endpoint: string } }>({ mutationFn: ({ data }) => apiFetch("/api/analyze", { method: "POST", body: JSON.stringify(data) }) }); }
export function useGetSessions(o?: { query?: object }) { return useQuery<any[]>({ queryKey: getGetSessionsQueryKey(), queryFn: () => apiFetch("/api/sessions"), ...(o?.query ?? {}) }); }
export function useDeleteSession() { return useMutation<any, Error, { id: number }>({ mutationFn: ({ id }) => apiFetch(`/api/sessions/${id}`, { method: "DELETE" }) }); }
export function useGetSettings(o?: { query?: object }) { return useQuery<any>({ queryKey: getGetSettingsQueryKey(), queryFn: () => apiFetch("/api/settings"), ...(o?.query ?? {}) }); }
export function useUpdateSettings() { return useMutation<any, Error, { data: object }>({ mutationFn: ({ data }) => apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(data) }) }); }
export function useGetFakeData(o?: { query?: object }) { return useQuery<any>({ queryKey: getGetFakeDataQueryKey(), queryFn: () => apiFetch("/api/fake/data"), ...(o?.query ?? {}) }); }
// BUG FIX: SSE endi token query param talab qiladi
export function getSseUrl(): string {
  const token = getToken();
  return token ? `${API_URL}/api/events?token=${encodeURIComponent(token)}` : `${API_URL}/api/events`;
}
export const getGetBlockedIpsQueryKey = () => ["blocked-ips"] as const;
export function useGetBlockedIps(o?: { query?: object }) { return useQuery<any[]>({ queryKey: getGetBlockedIpsQueryKey(), queryFn: () => apiFetch("/api/blocked-ips"), ...(o?.query ?? {}) }); }
export function useBlockIp() { return useMutation<any, any, { data: { ip: string; reason?: string } }>({ mutationFn: ({ data }) => apiFetch("/api/blocked-ips", { method: "POST", body: JSON.stringify(data) }) }); }
export function useUnblockIp() { return useMutation<any, any, { ip: string }>({ mutationFn: ({ ip }) => apiFetch(`/api/blocked-ips/${encodeURIComponent(ip)}`, { method: "DELETE" }) }); }