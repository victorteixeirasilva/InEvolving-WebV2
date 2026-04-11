"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Input } from "@/components/ui/Input";
import { apiTypeForCategory, FINANCA_TX_CATEGORY_LABEL } from "@/lib/financas-transactions";
import { formatDateEnCA } from "@/lib/tasks/format-task-date-local";
import type { FinancaTransacaoView, FinancaTxCategory } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export type FinancasTransactionFormInitial = {
  description: string;
  value: number;
  date: string;
  category: FinancaTxCategory;
};

export type FinancasTransactionFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: string;
  variant: "create" | "duplicate";
  initial: FinancasTransactionFormInitial | null;
  /** Pode ser assíncrono (API); o modal só fecha após resolver sem erro. */
  onSubmit: (row: FinancaTransacaoView) => void | Promise<void>;
};

const CATEGORY_OPTIONS: { value: FinancaTxCategory; label: string }[] = [
  { value: "cost", label: FINANCA_TX_CATEGORY_LABEL.cost },
  { value: "invest", label: FINANCA_TX_CATEGORY_LABEL.invest },
  { value: "extra", label: FINANCA_TX_CATEGORY_LABEL.extra },
];

function defaultDateForMonth(selectedMonth: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const thisMonth = `${y}-${m}`;
  if (thisMonth === selectedMonth) {
    return formatDateEnCA(now);
  }
  return `${selectedMonth}-01`;
}

function newLocalId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinancasTransactionFormModal({
  open,
  onOpenChange,
  selectedMonth,
  variant,
  initial,
  onSubmit,
}: FinancasTransactionFormModalProps) {
  const [description, setDescription] = useState("");
  const [valueStr, setValueStr] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<FinancaTxCategory>("cost");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = variant === "duplicate" ? "Duplicar transação" : "Nova transação";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    if (initial) {
      setDescription(initial.description);
      setValueStr(String(initial.value));
      setDate(initial.date);
      setCategory(initial.category);
    } else {
      setDescription("");
      setValueStr("");
      setDate(defaultDateForMonth(selectedMonth));
      setCategory("cost");
    }
  }, [open, initial, selectedMonth]);

  const canSubmit = useMemo(() => {
    if (description.trim().length === 0 || !date || date.length < 10) return false;
    if (valueStr.trim() === "") return false;
    const v = Number(valueStr.replace(",", "."));
    return Number.isFinite(v);
  }, [description, valueStr, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valueStr.replace(",", "."));
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    if (!Number.isFinite(v)) {
      setError("Valor inválido.");
      return;
    }
    if (!date || date.length < 10) {
      setError("Informe a data.");
      return;
    }
    const row: FinancaTransacaoView = {
      id: newLocalId(),
      date,
      description: description.trim(),
      value: v,
      type: apiTypeForCategory(category),
      category,
    };
    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onSubmit(row));
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível salvar a transação.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[75] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[75] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:p-6"
          aria-describedby="fin-tx-form-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className={cn(
              "my-auto w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[color-mix(in_srgb,var(--glass-bg)_78%,transparent)] shadow-glass-lg backdrop-blur-xl"
            )}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />
            <div className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] p-4 sm:p-5">
              <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">{title}</Dialog.Title>
              <Dialog.Close
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
              <p id="fin-tx-form-desc" className="text-sm text-[var(--text-muted)]">
                {variant === "duplicate"
                  ? "Revise os dados e confirme para criar uma nova transação (a original não é alterada)."
                  : "Preencha os campos. Com login, a transação é enviada à API; sem token, fica só neste dispositivo."}
              </p>
              <div>
                <label htmlFor="fin-tx-desc" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Descrição
                </label>
                <Input
                  id="fin-tx-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="py-2.5"
                  placeholder="Ex.: Mercado, Aporte…"
                  autoComplete="off"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="fin-tx-value" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Valor (R$)
                </label>
                <Input
                  id="fin-tx-value"
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  className="py-2.5"
                  placeholder="0,00"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="fin-tx-date" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Data
                </label>
                <Input
                  id="fin-tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="py-2.5"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="fin-tx-cat" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Tipo
                </label>
                <GlassSelect
                  id="fin-tx-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FinancaTxCategory)}
                  disabled={submitting}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </GlassSelect>
              </div>
              {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={submitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || submitting}>
                  {submitting ? "Enviando…" : "Confirmar"}
                </Button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
