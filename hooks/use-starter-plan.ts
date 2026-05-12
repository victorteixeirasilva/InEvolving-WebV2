"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

/**
 * Retorna `true` se o usuário possui plano Starter (plano mais básico),
 * lendo o valor salvo no `localStorage` após o login.
 * Atualiza reativamente quando `setStarterPlan` é chamado.
 */
export function useStarterPlan(): boolean {
  const [isStarter, setIsStarter] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.isStarterPlan);
      setIsStarter(raw === "true");
    } catch {
      /* ignore */
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.isStarterPlan) {
        setIsStarter(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return isStarter;
}

/** Persiste a flag do plano Starter no `localStorage`. */
export function setStarterPlan(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.isStarterPlan, String(value));
  } catch {
    /* ignore */
  }
}
