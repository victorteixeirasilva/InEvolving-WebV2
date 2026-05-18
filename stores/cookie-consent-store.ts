"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalyticsConsent } from "@/lib/cookie-consent";
import { STORAGE_KEYS } from "@/lib/constants";
import { browserSafeJSONStorage } from "@/lib/storage/zustand-safe-json-storage";

type CookieConsentState = {
  analytics: AnalyticsConsent;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
};

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      analytics: null,
      acceptAnalytics: () => set({ analytics: "granted" }),
      rejectAnalytics: () => set({ analytics: "denied" }),
    }),
    {
      name: STORAGE_KEYS.cookieConsentAnalytics,
      storage: browserSafeJSONStorage,
      partialize: (s) => ({ analytics: s.analytics }),
    }
  )
);
