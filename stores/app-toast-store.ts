"use client";

import { create } from "zustand";

export type AppToastVariant = "default" | "success" | "error";

export type AppToastItem = {
  id: string;
  message: string;
  variant: AppToastVariant;
};

type AppToastState = {
  items: AppToastItem[];
  show: (message: string, variant?: AppToastVariant) => string;
  dismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 4800;

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
  show: (message, variant = "default") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((s) => ({ items: [...s.items, { id, message, variant }] }));
    const t = setTimeout(() => {
      timeouts.delete(id);
      get().dismiss(id);
    }, AUTO_DISMISS_MS);
    timeouts.set(id, t);
    return id;
  },
  dismiss: (id) => {
    clearScheduled(id);
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
  },
}));
