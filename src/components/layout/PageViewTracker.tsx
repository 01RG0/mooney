"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

/** Tracks every client-side navigation as a page view.
 *  Uses a debounce ref to skip rapid duplicate fires (e.g. Strict Mode double-render)
 *  but still counts every distinct navigation, including re-visits. */
export function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef<{ path: string; at: number }>({ path: '', at: 0 });

  useEffect(() => {
    const now = Date.now();
    const prev = last.current;
    // Skip if same path was tracked within 2 seconds (handles Strict Mode/React 18 double-fire)
    if (prev.path === pathname && now - prev.at < 2000) return;
    last.current = { path: pathname, at: now };
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
