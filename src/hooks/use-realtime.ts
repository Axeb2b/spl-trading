"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RealtimeState = "connecting" | "live" | "reconnecting" | "polling" | "offline";

export type RealtimeEvent = {
  type: string;
  payload: unknown;
};

type UseRealtimeOptions = {
  enabled?: boolean;
  onEvent?: (event: RealtimeEvent) => void;
};

const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];
const HEARTBEAT_TIMEOUT_MS = 45_000;
const POLL_FALLBACK_MS = 30_000;

const EVENT_TYPES = [
  "deposit.updated",
  "withdrawal.updated",
  "transaction.created",
  "notification.created",
  "onboarding.updated",
  "overview.updated",
  "admin.queue.updated",
];

/**
 * Realtime client.
 *
 * One `EventSource` per page carries every live surface. When the stream
 * cannot be established the client degrades to polling instead of showing
 * stale data behind a green "Live" badge.
 */
export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true, onEvent } = options;
  const [state, setState] = useState<RealtimeState>("connecting");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);

  const sourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const failuresRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  // The connect callback refers to itself for the reconnect backoff, so it is
  // reached through a ref rather than by name (a self-reference inside the
  // callback body trips react-hooks/immutability).
  const connectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      void fetch("/api/v1/dashboard/summary", { credentials: "include", cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((body) => {
          if (body) onEventRef.current?.({ type: "overview.updated", payload: body });
        })
        .catch(() => undefined);
    }, POLL_FALLBACK_MS);
  }, [stopPolling]);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    sourceRef.current?.close();

    const source = new EventSource("/api/v1/stream", { withCredentials: true });
    sourceRef.current = source;

    source.addEventListener("open", () => {
      retryRef.current = 0;
      failuresRef.current = 0;
      stopPolling();
      setState("live");
    });

    const handle = (type: string) => (raw: MessageEvent) => {
      setLastEventAt(new Date().toISOString());
      let payload: unknown = {};
      try {
        payload = JSON.parse(raw.data as string) as unknown;
      } catch {
        payload = {};
      }
      onEventRef.current?.({ type, payload });
    };

    for (const type of EVENT_TYPES) {
      source.addEventListener(type, handle(type));
    }

    source.addEventListener("heartbeat", (raw) => {
      let payload: { serverNow?: string } = {};
      try {
        payload = JSON.parse((raw as MessageEvent).data as string) as { serverNow?: string };
      } catch {
        payload = {};
      }
      setLastHeartbeatAt(payload.serverNow ?? new Date().toISOString());
    });

    source.addEventListener("error", () => {
      failuresRef.current += 1;
      source.close();
      if (failuresRef.current >= 3) {
        setState("polling");
        startPolling();
        setTimeout(() => {
          if (sourceRef.current === null) setState("connecting");
        }, 60_000);
        return;
      }
      setState("reconnecting");
      const delay = BACKOFF_MS[Math.min(retryRef.current, BACKOFF_MS.length - 1)] ?? 1000;
      retryRef.current += 1;
      setTimeout(() => connectRef.current?.(), delay + Math.round(Math.random() * 400));
    });
  }, [startPolling, stopPolling]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const reconnect = useCallback(() => {
    sourceRef.current?.close();
    retryRef.current = 0;
    failuresRef.current = 0;
    setState("connecting");
    connectRef.current?.();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();

    const onOnline = () => {
      setState("connecting");
      reconnect();
    };
    const onOffline = () => setState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const watchdog = setInterval(() => {
      setState((current) => {
        if (current !== "live") return current;
        const beat = lastHeartbeatAt ? Date.parse(lastHeartbeatAt) : 0;
        if (beat && Date.now() - beat > HEARTBEAT_TIMEOUT_MS) return "reconnecting";
        return current;
      });
    }, 10_000);

    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
      stopPolling();
      clearInterval(watchdog);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, connect, reconnect, stopPolling]);

  return { state, lastEventAt, lastHeartbeatAt, reconnect };
}
