import { useAppToastStore, type AppToastShowSecondArg } from "@/stores/app-toast-store";

/** Toasts globais (glass, rodapé). Use em eventos/handlers no cliente. */
export const appToast = {
  show: (message: string, second?: AppToastShowSecondArg) =>
    useAppToastStore.getState().show(message, second),
  success: (message: string, second?: AppToastShowSecondArg) => {
    if (second === undefined) return useAppToastStore.getState().show(message, "success");
    if (typeof second === "string") return useAppToastStore.getState().show(message, second);
    return useAppToastStore.getState().show(message, { ...second, variant: second.variant ?? "success" });
  },
  error: (message: string, second?: AppToastShowSecondArg) => {
    if (second === undefined) return useAppToastStore.getState().show(message, "error");
    if (typeof second === "string") return useAppToastStore.getState().show(message, second);
    return useAppToastStore.getState().show(message, { ...second, variant: second.variant ?? "error" });
  },
  dismiss: (id: string) => useAppToastStore.getState().dismiss(id),
};

export type { AppToastShowSecondArg, AppToastAction } from "@/stores/app-toast-store";
