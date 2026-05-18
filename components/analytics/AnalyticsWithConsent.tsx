"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from "@/lib/analytics";
import { isAnalyticsConsentGranted } from "@/lib/cookie-consent";
import { useCookieConsentStore } from "@/stores/cookie-consent-store";

export function AnalyticsWithConsent() {
  const analytics = useCookieConsentStore((s) => s.analytics);

  if (!isGoogleAnalyticsEnabled() || !GA_MEASUREMENT_ID || !isAnalyticsConsentGranted(analytics)) {
    return null;
  }

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
