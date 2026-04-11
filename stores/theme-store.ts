"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { browserSafeJSONStorage } from "@/lib/storage/zustand-safe-json-storage";
import { STORAGE_KEYS, type TemaLegado } from "@/lib/constants";

export type ThemeMode = "light" | "dark";

function legadoToMode(t: TemaLegado | null): ThemeMode {
  if (t === "2") return "light";
  return "dark";
}

function modeToLegado(m: ThemeMode): TemaLegado {
  return m === "light" ? "2" : "1";
}

type ThemeState = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  setFromLegado: (t: TemaLegado) => void;
  applyDom: (m: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      applyDom: (mode) => {
        if (typeof document === "undefined") return;
        document.documentElement.dataset.theme = mode;
        document.documentElement.classList.toggle("dark", mode === "dark");
      },
      setMode: (mode) => {
        set({ mode });
        get().applyDom(mode);
        try {
          localStorage.setItem(STORAGE_KEYS.tema, modeToLegado(mode));
        } catch {
          /* ignore */
        }
      },
      toggle: () => {
        const next = get().mode === "dark" ? "light" : "dark";
        get().setMode(next);
      },
      setFromLegado: (t) => get().setMode(legadoToMode(t)),
    }),
    {
      name: "inevolving-theme",
      storage: browserSafeJSONStorage,
      partialize: (s) => ({ mode: s.mode }),
    }
  )
);

/** Sincroniza chave legada `tema` (1|2) na primeira hidratação do cliente. */
export function syncLegacyThemeKey() {
  if (typeof window === "undefined") return;
  const legado = localStorage.getItem(STORAGE_KEYS.tema) as TemaLegado | null;
  if (legado === "1" || legado === "2") {
    useThemeStore.getState().setFromLegado(legado);
  } else {
    useThemeStore.getState().applyDom(useThemeStore.getState().mode);
  }
}
