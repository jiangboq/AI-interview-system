"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getSessionTimeoutMs, getToken, getTokenExpiryMs, refreshToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CHECK_INTERVAL_MS = 15_000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/** Logs the user out after the server-configured window (ACCESS_TOKEN_EXPIRE_MINUTES)
 * of inactivity, and silently refreshes the token while the user stays active. */
export function useSessionTimeout(): void {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!getToken()) return;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActive));

    const interval = setInterval(async () => {
      const timeoutMs = getSessionTimeoutMs();
      if (!timeoutMs) return;

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= timeoutMs) {
        clearToken();
        clearInterval(interval);
        router.replace("/login?reason=timeout");
        return;
      }

      // Only hit the refresh endpoint once the token is nearing expiry,
      // rather than on every activity check.
      const expiryMs = getTokenExpiryMs();
      const nearingExpiry = expiryMs !== null && expiryMs - Date.now() < timeoutMs / 2;
      if (!nearingExpiry) return;

      const ok = await refreshToken(API_URL);
      if (!ok) {
        clearToken();
        clearInterval(interval);
        router.replace("/login?reason=timeout");
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActive));
      clearInterval(interval);
    };
  }, [router]);
}
