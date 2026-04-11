"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/GlassCard";
import { StaggerList } from "@/features/animations/StaggerList";
import { FadeInView } from "@/components/layout/ScrollReveal";
import { NovoObjetivoModal } from "@/components/features/objetivos/NovoObjetivoModal";
import { EditarObjetivoModal } from "@/components/features/objetivos/EditarObjetivoModal";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchUserObjectives } from "@/lib/objectives/fetch-user-objectives";
import {
  aggregateTaskCountsForObjective,
  fetchTasksByObjective,
} from "@/lib/tasks/fetch-tasks-by-objective";
import { cn } from "@/lib/utils";
import type { Objective } from "@/lib/types/models";

type Filter = "IN_PROGRESS" | "DONE" | "ALL";

type ObjectiveWithCategory = Objective & { categoryName: string };

function withCategoryName(objectives: Objective[]): ObjectiveWithCategory[] {
  return objectives.map((o) => ({ ...o, categoryName: "Sem categoria" }));
}

/** Deduplica por `id` (prioriza `IN_PROGRESS`); ordena em andamento primeiro, depois nome. */
function prepareObjectivesList(objectives: Objective[]): ObjectiveWithCategory[] {
  const map = new Map<string, ObjectiveWithCategory>();
  for (const o of withCategoryName(objectives)) {
    const key = String(o.id);
    const existing = map.get(key);
    if (!existing || existing.statusObjective === "DONE") {
      map.set(key, o);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.statusObjective !== b.statusObjective) {
      return a.statusObjective === "IN_PROGRESS" ? -1 : 1;
    }
    return a.nameObjective.localeCompare(b.nameObjective, "pt-BR");
  });
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "DONE", label: "Concluídos" },
  { value: "ALL", label: "Todos" },
];

export default function ObjetivosPage() {
  const router = useRouter();
  const didRedirect401Ref = useRef(false);
  const [list, setList] = useState<ObjectiveWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>("IN_PROGRESS");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ObjectiveWithCategory | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): usuário na área logada sem token — redirecionar para `/login` ou renovar sessão.
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
        return;
      }

      const result = await fetchUserObjectives(jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        if (!didRedirect401Ref.current) {
          didRedirect401Ref.current = true;
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
        }
        setLoading(false);
        return;
      }

      if (result.kind !== "ok") {
        // TODO (contract): mensagem do corpo em 4xx/5xx quando padronizada; retry para 503/429.
        setLoadError(true);
        setList([]);
        setLoading(false);
        return;
      }

      setLoadError(false);
      const baseList = prepareObjectivesList(result.objectives);

      const taskResults = await Promise.all(
        baseList.map((o) => fetchTasksByObjective(jwtToken, o.id))
      );
      if (cancelled) return;

      if (taskResults.some((r) => r.kind === "unauthorized")) {
        if (!didRedirect401Ref.current) {
          didRedirect401Ref.current = true;
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
        }
        setLoading(false);
        return;
      }

      // TODO (contract): falhas parciais por objetivo (`http_error` / `network_error`) — toast, retry e manter contagens anteriores.
      const enriched = baseList.map((o, i) => {
        const tr = taskResults[i];
        if (tr?.kind !== "ok") return o;
        return { ...o, ...aggregateTaskCountsForObjective(tr.tasks) };
      });

      setList(enriched);
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered =
    filter === "ALL"
      ? list
      : list.filter((o) => {
          if (filter === "DONE") return o.statusObjective === "DONE";
          return o.statusObjective === "IN_PROGRESS";
        });

  const handleCreated = (obj: Objective) => {
    const row: ObjectiveWithCategory = { ...obj, categoryName: "Sem categoria" };
    setList((prev) => [row, ...prev]);

    void (async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        return;
      }
      if (!jwtToken) return;

      const tr = await fetchTasksByObjective(jwtToken, obj.id);
      if (tr.kind === "unauthorized") {
        if (!didRedirect401Ref.current) {
          didRedirect401Ref.current = true;
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
        }
        return;
      }
      if (tr.kind !== "ok") return;

      const stats = aggregateTaskCountsForObjective(tr.tasks);
      setList((prev) =>
        prev.map((o) => (String(o.id) === String(obj.id) ? { ...o, ...stats } : o))
      );
    })();
  };

  const handleSaved = (
    updated: Pick<Objective, "id" | "nameObjective" | "descriptionObjective" | "statusObjective"> & {
      completionDate?: string | null;
    }
  ) =>
    setList((prev) =>
      prev.map((o) => (String(o.id) === String(updated.id) ? { ...o, ...updated } : o))
    );

  const handleDeleted = (objectiveId: Objective["id"]) => {
    setList((prev) => prev.filter((o) => String(o.id) !== String(objectiveId)));
    setEditing(null);
  };

  const isDoneStatus = (s: Objective["statusObjective"]) => s === "DONE";

  return (
    <>
      <NovoObjetivoModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
      />
      <EditarObjetivoModal
        open={editing !== null}
        objective={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      <div className="mx-auto max-w-5xl space-y-6 pt-4 md:pt-6">
        {/* ── Cabeçalho ── */}
        <FadeInView>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Objetivos</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg active:scale-95 dark:from-brand-purple dark:to-brand-pink"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden />
              Novo objetivo
            </button>
          </div>
        </FadeInView>

        {loading && (
          <GlassCard>
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">Carregando objetivos…</p>
          </GlassCard>
        )}

        {!loading && loadError && list.length === 0 && (
          <GlassCard className="border-dashed border-brand-pink/30">
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">
              Não foi possível carregar seus objetivos. Verifique a conexão ou faça login novamente.
            </p>
          </GlassCard>
        )}

        {/* ── Filtros ── */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                  filter === value
                    ? "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow dark:from-brand-purple dark:to-brand-pink"
                    : "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)]"
                )}
              >
                {label}
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    filter === value
                      ? "bg-white/20 text-white"
                      : "bg-[var(--glass-border)] text-[var(--text-muted)]"
                  )}
                >
                  {value === "ALL"
                    ? list.length
                    : value === "DONE"
                      ? list.filter((o) => isDoneStatus(o.statusObjective)).length
                      : list.filter((o) => o.statusObjective === "IN_PROGRESS").length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Lista ── */}
        {!loading && (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="border-dashed border-brand-cyan/25">
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                    {filter === "IN_PROGRESS"
                      ? "Nenhum objetivo em andamento."
                      : filter === "DONE"
                        ? "Nenhum objetivo concluído ainda."
                        : "Nenhum objetivo cadastrado."}
                    {filter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setFilter("ALL")}
                        className="ml-1 text-brand-cyan underline-offset-2 hover:underline"
                      >
                        Ver todos
                      </button>
                    )}
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <StaggerList className="grid gap-4 md:grid-cols-2">
                  {filtered.map((o) => (
                    <button
                      key={String(o.id)}
                      type="button"
                      onClick={() => setEditing(o)}
                      className="group h-full w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
                      aria-label={`Editar objetivo: ${o.nameObjective}`}
                    >
                      <GlassCard className="flex h-full flex-col transition-all duration-[380ms] group-hover:border-brand-cyan/40 group-hover:shadow-glow">
                        {/* <p className="text-xs font-semibold uppercase tracking-wide text-brand-cyan">
                          {o.categoryName}
                        </p> */}

                        <div className="mt-2 flex items-start justify-between gap-2">
                          <h2 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
                            {o.nameObjective}
                          </h2>
                          <span
                            className={cn(
                              "shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                              isDoneStatus(o.statusObjective)
                                ? "bg-emerald-400/15 text-emerald-400"
                                : "bg-brand-cyan/15 text-brand-cyan"
                            )}
                          >
                            {isDoneStatus(o.statusObjective) ? "Concluído" : "Em andamento"}
                          </span>
                        </div>

                        {o.descriptionObjective && (
                          <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">
                            {o.descriptionObjective}
                          </p>
                        )}

                        {(o.totNumberTasks ?? 0) > 0 && (
                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
                              <span>
                                {o.numberTasksDone ?? 0} de {o.totNumberTasks} tarefas concluídas
                              </span>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {Math.round(
                                  ((o.numberTasksDone ?? 0) / (o.totNumberTasks ?? 1)) * 100
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-700"
                                style={{
                                  width: `${Math.round(
                                    ((o.numberTasksDone ?? 0) / (o.totNumberTasks ?? 1)) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <p className="mt-3 text-[11px] text-[var(--text-muted)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          Clique para editar
                        </p>
                      </GlassCard>
                    </button>
                  ))}
                </StaggerList>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
