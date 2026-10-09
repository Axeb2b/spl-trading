"use client";

import { Toaster } from "@/components/ui/sonner";
import { useAuthTheme } from "@/components/sites/spl-trading/theme-toggle";

/**
 * Toast host bound to the SPL theme so notifications match the active
 * light/dark surface instead of following the OS preference.
 */
export function AppToaster() {
  const theme = useAuthTheme();
  return <Toaster theme={theme} position="top-right" richColors closeButton />;
}