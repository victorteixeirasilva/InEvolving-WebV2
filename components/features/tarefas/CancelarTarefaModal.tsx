"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchCancellationReasons } from "@/lib/dashboard/fetch-cancellation-reasons";
import { getTopCancellationReasons, parseCancellationSegments } from "@/lib/cancel-reasons-storage";

const ease = [0.16, 1, 0.3, 1] as const;

export type CancelarTarefaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  idObjective: number | string;
  onConfirm: (reasonsRaw: string) => void;
};

export function CancelarTarefaModal({
  open,
  onOpenChange,
  taskName,
  idObjective,
  onConfirm,
}: CancelarTarefaModalProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [top, setTop] = useState<{ reason: string; count: number }[]>([]);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [reasonsFromApi, setReasonsFromApi] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setError(null);
    setTop([]);
    setReasonsFromApi(false);
    setReasonsLoading(false);
    let cancelled = false;

    const oid = idObjective;
    const hasObjective =
      oid !== "" && oid != null && !(typeof oid === "number" && !Number.isFinite(oid));

    const applyLocalFallback = () => {
      if (cancelled) return;
      setTop(getTopCancellationReasons(oid));
      setReasonsFromApi(false);
    };

    const run = async () => {
      if (!hasObjective) {
        setReasonsLoading(false);
        return;
      }

      let jwt = "";
      try {
        jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwt) {
        setReasonsLoading(false);
        applyLocalFallback();
        return;
      }

      setReasonsLoading(true);
      const result = await fetchCancellationReasons(oid, jwt);
      if (cancelled) return;
      setReasonsLoading(false);

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        applyLocalFallback();
        return;
      }

      if (result.kind === "ok" && result.reasons.length > 0) {
        const sorted = [...result.reasons].sort(
          (a, b) => b.count - a.count || a.reason.localeCompare(b.reason)
        );
        setTop(sorted.slice(0, 16));
        setReasonsFromApi(true);
        return;
      }

      applyLocalFallback();
    };

    void run();
    return () => {
      cancelled = true;
      setReasonsLoading(false);
    };
  }, [open, idObjective, router]);

  const appendReason = (r: string) => {
    const t = value.trim();
    const seg = r.trim();
    if (!seg) return;
    setValue(t ? `${t}; ${seg}` : seg);
    setError(null);
  };

  const submit = () => {
    const segments = parseCancellationSegments(value);
    if (segments.length === 0) {
      setError("Informe ao menos um motivo. Use ponto e vírgula (;) para separar vários.");
      return;
    }
    onConfirm(value.trim());
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[70] bg-navy/60 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/70"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[70] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-8 outline-none sm:p-6"
          aria-describedby="cancel-tarefa-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass"
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-pink/80 via-[var(--text-muted)] to-brand-pink/60" />
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-extrabold text-[var(--text-primary)]">
                    Cancelar tarefa
                  </Dialog.Title>
                  <p id="cancel-tarefa-desc" className="mt-1 text-sm text-[var(--text-muted)]">
                    Informe os motivos do cancelamento, separados por <span className="font-mono text-brand-cyan">;</span>
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-[var(--text-primary)]">{taskName}</p>
                </div>
                <Dialog.Close
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </Dialog.Close>
              </div>

              <div className="flex flex-col gap-3">
                <label htmlFor="cancel-reasons" className="text-sm font-medium text-[var(--text-primary)]">
                  Motivos <span className="text-brand-pink">*</span>
                </label>
                <textarea
                  id="cancel-reasons"
                  rows={3}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ex.: Imprevisto; Trabalho; Amway"
                  className={cn(
                    "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                    "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.2)] focus:outline-none"
                  )}
                />
                {error && (
                  <p className="text-sm text-brand-pink" role="alert">
                    {error}
                  </p>
                )}

                {reasonsLoading && (
                  <p className="text-xs text-[var(--text-muted)]">Carregando motivos já usados neste objetivo…</p>
                )}

                {!reasonsLoading && top.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {reasonsFromApi ? "Motivos neste objetivo (dashboard)" : "Mais usados neste aparelho"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {top.map(({ reason, count }, idx) => (
                        <button
                          key={`${idx}-${reason}`}
                          type="button"
                          onClick={() => appendReason(reason)}
                          className={cn(
                            "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--glass-border)]",
                            "bg-white/5 px-2.5 py-1.5 text-left text-xs font-medium text-[var(--text-primary)]",
                            "transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/10"
                          )}
                          title={count > 0 ? `${count} registro(s)` : "Incluir no campo"}
                        >
                          <span className="truncate">{reason}</span>
                          {count > 0 && (
                            <span className="shrink-0 rounded-md bg-[var(--glass-border)] px-1 py-0.5 text-[10px] text-[var(--text-muted)]">
                              {count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex gap-2 border-t border-[var(--glass-border)] pt-4">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      Voltar
                    </Button>
                  </Dialog.Close>
                  <Button type="button" className="flex-1 bg-brand-pink/90 hover:bg-brand-pink" onClick={submit}>
                    Confirmar cancelamento
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
