"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const BOT_PATTERN = /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck/i;

export function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (BOT_PATTERN.test(navigator.userAgent)) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        ip: "",
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
