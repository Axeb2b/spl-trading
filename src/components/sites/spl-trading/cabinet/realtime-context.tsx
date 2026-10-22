"use client";

import { createContext, useContext } from "react";
import type { RealtimeEvent, RealtimeState } from "@/hooks/use-realtime";

export type RealtimeListener = (event: RealtimeEvent) => void;

export type CabinetRealtime = {
  state: RealtimeState;
  /**
   * Registers a listener on the shell's single EventSource.
   *
   * Returns an unsubscribe function. The shell owns the connection; every
   * live surface on the page shares it instead of opening its own stream.
   */
  subscribe: (listener: RealtimeListener) => () => void;
};

export const RealtimeContext = createContext<CabinetRealtime | null>(null);

export function useCabinetRealtime(): CabinetRealtime {
  const value = useContext(RealtimeContext);
  if (!value) {
    throw new Error("useCabinetRealtime must be used inside CabinetShell");
  }
  return value;
}
