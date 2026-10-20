"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __SPL_NOW__?: string;
  }
}

/**
 * Anchors "now" to the SERVER clock.
 *
 * The client clock is only a tick source; `skew` is computed once at mount so
 * relative timestamps stay correct on a device with a wrong clock. The value
 * is null until mount, so the server render and the first client render are
 * always identical.
 */
export function useServerNow(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const serverMs = window.__SPL_NOW__ ? Date.parse(window.__SPL_NOW__) : Date.now();
    const skew = serverMs - Date.now();

    const tick = () => setNow(Date.now() + skew);
    tick();

    const id = window.setInterval(tick, 15_000);
    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return now;
}
