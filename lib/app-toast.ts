import { useAppToastStore } from "@/stores/app-toast-store";

/** Toasts globais (glass, rodapé). Use em eventos/handlers no cliente. */
export const appToast = {
  show: (message: string) => useAppToastStore.getState().show(message, "default"),
  success: (message: string) => useAppToastStore.getState().show(message, "success"),
  error: (message: string) => useAppToastStore.getState().show(message, "error"),
  dismiss: (id: string) => useAppToastStore.getState().dismiss(id),
};
