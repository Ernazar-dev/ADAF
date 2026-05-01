import { useState, useEffect } from "react";
export const getAuthToken   = () => localStorage.getItem("adaf_token");
export const setAuthToken   = (t: string) => localStorage.setItem("adaf_token", t);
export const removeAuthToken = () => localStorage.removeItem("adaf_token");
export const getIsDeception  = () => localStorage.getItem("adaf_deception") === "true";
export const setIsDeception  = (v: boolean) => localStorage.setItem("adaf_deception", String(v));
export const removeIsDeception = () => localStorage.removeItem("adaf_deception");

// BUG FIX: Token ni to'g'ri parse qilish
// Eski: atob(token) — to'g'ridan token ni dekod qilardi, HMAC format emas
// Yangi: token = "payloadBase64url.signature" → faqat payload qismini olamiz
export function parseTokenPayload(token: string): { id: number; username: string } | null {
  try {
    const payloadB64 = token.split(".")[0];
    if (!payloadB64) return null;
    const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch { return null; }
}

export function useAuth() {
  const [token, setToken]             = useState<string | null>(getAuthToken());
  const [isDeception, setIsDeceptionState] = useState<boolean>(getIsDeception());

  useEffect(() => {
    const handler = () => { setToken(getAuthToken()); setIsDeceptionState(getIsDeception()); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = (newToken: string, deception: boolean) => {
    setAuthToken(newToken); setIsDeception(deception);
    setToken(newToken); setIsDeceptionState(deception);
  };
  const logout = () => {
    removeAuthToken(); removeIsDeception();
    setToken(null); setIsDeceptionState(false);
  };
  return { token, isDeception, login, logout };
}