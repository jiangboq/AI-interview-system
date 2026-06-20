"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, isAdmin } from "./auth";

export function useAdminGuard(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else if (!isAdmin()) {
      router.replace("/interviews");
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}
