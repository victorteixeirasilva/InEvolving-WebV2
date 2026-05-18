"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from "@/lib/analytics";
import { isAnalyticsConsentGranted } from "@/lib/cookie-consent";
import { useCookieConsentStore } from "@/stores/cookie-consent-store";

function RouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useCookieConsentStore((s) => s.analytics);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled() || !GA_MEASUREMENT_ID || !isAnalyticsConsentGranted(analytics)) {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (lastPathRef.current === pagePath) {
      return;
    }
    lastPathRef.current = pagePath;

    sendGAEvent("config", GA_MEASUREMENT_ID, { page_path: pagePath });
  }, [pathname, searchParams, analytics]);

  return null;
}

/** Envia page_view ao GA4 em cada troca de rota (navegação client-side do Next.js). */
export function GoogleAnalyticsRouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
