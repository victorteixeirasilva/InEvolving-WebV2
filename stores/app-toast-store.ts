"use client";

import { create } from "zustand";

export type AppToastVariant = "default" | "success" | "error";

export type AppToastAction = {
  label: string;
  href: string;
};

export type AppToastItem = {
  id: string;
  message: string;
  variant: AppToastVariant;
  action?: AppToastAction;
};

export type ToastShowOptions = {
  variant?: AppToastVariant;
  action?: AppToastAction;
  dismissAfterMs?: number;
};

/** Segundo argumento de `show`: só variante (legado) ou opções completas. */
export type AppToastShowSecondArg = AppToastVariant | ToastShowOptions;

type AppToastState = {
  items: AppToastItem[];
  show: (message: string, second?: AppToastShowSecondArg) => string;
  dismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 4800;
const TOAST_WITH_ACTION_MS = 14000;

function parseShowSecondArg(second?: AppToastShowSecondArg): {
  variant: AppToastVariant;
  action?: AppToastAction;
  dismissAfterMs: number;
} {
  if (second == null) {
    return { variant: "default", dismissAfterMs: AUTO_DISMISS_MS };
  }
  if (typeof second === "string") {
    if (second === "default" || second === "success" || second === "error") {
      return { variant: second, dismissAfterMs: AUTO_DISMISS_MS };
    }
    return { variant: "default", dismissAfterMs: AUTO_DISMISS_MS };
  }
  const o = second as ToastShowOptions;
  const variant = o.variant ?? "default";
  const action = o.action;
  const fallbackMs = action ? TOAST_WITH_ACTION_MS : AUTO_DISMISS_MS;
  const raw = o.dismissAfterMs;
  const dismissAfterMs =
    typeof raw === "number" && Number.isFinite(raw) && raw >= 2000 ? raw : fallbackMs;
  return { variant, action, dismissAfterMs };
}

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function clearScheduled(id: string) {
  const t = timeouts.get(id);
  if (t) {
    clearTimeout(t);
    timeouts.delete(id);
  }
}

export const useAppToastStore = create<AppToastState>((set, get) => ({
  items: [],
  show: (message, second) => {
    const { variant, action, dismissAfterMs } = parseShowSecondArg(second);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((s) => ({ items: [...s.items, { id, message, variant, ...(action ? { action } : {}) }] }));
    const t = setTimeout(() => {
      timeouts.delete(id);
      get().dismiss(id);
    }, dismissAfterMs);
    timeouts.set(id, t);
    return id;
  },
  dismiss: (id) => {
    clearScheduled(id);
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
  },
}));
