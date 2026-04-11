"use client";

import { useEffect } from "react";
import { syncLegacyThemeKey } from "@/stores/theme-store";

export function ThemeHydration() {
  useEffect(() => {
    syncLegacyThemeKey();
  }, []);
  return null;
}
