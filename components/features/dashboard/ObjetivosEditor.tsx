"use client";

/**
 * Componente compartilhado entre NovaCategoriaModal e EditarCategoriaModal.
 * Gerencia a lista local de objetivos vinculados (adicionar / remover).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchUserObjectives } from "@/lib/objectives/fetch-user-objectives";
import type { Objective } from "@/lib/types/models";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── status badge ─── */
const statusConfig: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: "Em andamento", color: "text-brand-cyan" },
  DONE: { label: "Concluído", color: "text-emerald-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? { label: status, color: "text-[var(--text-muted)]" };
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-wide", s.color)}>
      {s.label}
    </span>
  );
}

/* ─── hook: pool de objetivos do usuário (picker “Adicionar”) ─── */
export function useAllObjectives(open: boolean) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): sessão sem token — redirecionar para `/login` ou obter token renovado.
        setObjectives([]);
        return;
      }

      const result = await fetchUserObjectives(jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        setObjectives([]);
        return;
      }

      if (result.kind === "ok") {
        setObjectives(result.objectives);
      } else {
        // TODO (contract): `http_error` / `network_error` — toast, retry e eventual cache local.
        setObjectives([]);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [open, router]);

  return objectives;
}

/* ─── ObjetivosEditor ─── */
type Props = {
  objectives: Objective[];
  onChange: (next: Objective[]) => void;
  allObjectives: Objective[];
  /** Enquanto a API de detalhes carrega — bloqueia adicionar/remover. */
  disabled?: boolean;
};

export function ObjetivosEditor({ objectives, onChange, allObjectives, disabled = false }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const linkedIds = new Set(objectives.map((o) => o.id));
  const available = allObjectives.filter(
    (o) =>
      !linkedIds.has(o.id) &&
      o.nameObjective.toLowerCase().includes(search.toLowerCase())
  );

  const add = (obj: Objective) => {
    onChange([...objectives, obj]);
    setSearch("");
  };

  const remove = (id: number | string) => onChange(objectives.filter((o) => o.id !== id));

  return (
    <div>
      {/* cabeçalho da seção */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Objetivos vinculados{" "}
          <span className="ml-1 rounded-full bg-brand-blue/15 px-1.5 py-0.5 text-xs font-semibold text-brand-cyan">
            {objectives.length}
          </span>
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPicker((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-300",
            showPicker
              ? "bg-brand-blue/15 text-brand-cyan"
              : "text-[var(--text-muted)] hover:bg-brand-blue/10 hover:text-brand-cyan",
            disabled && "pointer-events-none opacity-45"
          )}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          Adicionar
        </button>
      </div>

      {/* picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            {/* busca */}
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
              <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar objetivo…"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>

            {/* lista */}
            <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
              {available.length === 0 ? (
                <p className="p-3 text-center text-xs text-[var(--text-muted)]">
                  {search ? "Nenhum resultado" : "Todos os objetivos já estão vinculados"}
                </p>
              ) : (
                available.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => add(obj)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-brand-blue/10 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-blue/15">
                      <PlusIcon className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {obj.nameObjective}
                      </p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {obj.descriptionObjective}
                      </p>
                    </div>
                    <StatusBadge status={obj.statusObjective} />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* vinculados */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {objectives.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-[var(--glass-border)] px-4 py-4 text-center text-sm text-[var(--text-muted)]"
            >
              Nenhum objetivo vinculado. Clique em{" "}
              <strong className="font-semibold">Adicionar</strong> para incluir.
            </motion.p>
          )}

          {objectives.map((obj) => (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8, transition: { duration: 0.18 } }}
              transition={{ duration: 0.28, ease }}
              className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-cyan/15">
                <CheckIcon className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {obj.nameObjective}
                </p>
                <StatusBadge status={obj.statusObjective} />
              </div>
              <button
                type="button"
                aria-label={`Remover ${obj.nameObjective}`}
                disabled={disabled}
                onClick={() => remove(obj.id)}
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-brand-pink/10 hover:text-brand-pink",
                  disabled && "pointer-events-none opacity-45"
                )}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
