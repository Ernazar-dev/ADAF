import { useEffect, useRef } from "react";
import { getSseUrl } from "../lib/api";

export function useSSE(eventName: string, onMessage: (data: unknown) => void, enabled = true) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function connect() {
      if (closed) return;
      // BUG FIX: SSE_URL o'rniga getSseUrl() — token query param bilan
      es = new EventSource(getSseUrl());
      es.addEventListener(eventName, (e: MessageEvent) => {
        try { onMessageRef.current(JSON.parse(e.data)); } catch {}
      });
      es.onerror = () => {
        es?.close(); es = null;
        if (!closed) retryTimer = setTimeout(connect, 3000);
      };
    }
    connect();
    return () => { closed = true; if (retryTimer) clearTimeout(retryTimer); es?.close(); };
  }, [eventName, enabled]);
}