"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsUpDownIcon,
  FunnelIcon,
  Squares2X2Icon,
  FlagIcon,
  TagIcon,
  ViewColumnsIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { FadeInView } from "@/components/layout/ScrollReveal";
import { NovaTarefaModal } from "@/components/features/tarefas/NovaTarefaModal";
import { EditarTarefaModal } from "@/components/features/tarefas/EditarTarefaModal";
import { KanbanBoard } from "@/components/features/tarefas/KanbanBoard";
import { CancelarTarefaModal } from "@/components/features/tarefas/CancelarTarefaModal";
import { DateField } from "@/components/ui/DateField";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { fetchDashboardCategories } from "@/lib/dashboard/fetch-dashboard-categories";
import { fetchCategoryObjectives } from "@/lib/dashboard/fetch-category-objectives";
import { allObjectives, mockDashboard } from "@/lib/mock-data";
import { fetchUserObjectives } from "@/lib/objectives/fetch-user-objectives";
import { fetchTasksByDate } from "@/lib/tasks/fetch-tasks-by-date";
import { fetchTaskById } from "@/lib/tasks/fetch-task-by-id";
import { fetchTasksLate } from "@/lib/tasks/fetch-tasks-late";
import { fetchTasksByObjective } from "@/lib/tasks/fetch-tasks-by-objective";
import {
  addOneLocalCalendarDay,
  formatDateEnCA,
  parseLocalYmdAtNoon,
  taskDateToLocalCalendarYmd,
  toDateInputValue,
} from "@/lib/tasks/format-task-date-local";
import { isTaskDisplayRecurring } from "@/lib/tasks/task-display-recurring";
import { patchTaskStatus } from "@/lib/tasks/patch-task-status";
import { isTaskBlockedByObjectiveForEdit } from "@/lib/tasks/task-edit-policy";
import { recordCancellationReasons } from "@/lib/cancel-reasons-storage";
import { loadAcceptedSharedCategories } from "@/lib/category-share-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { loadAjustesProfile } from "@/lib/ajustes-storage";
import {
  loadCollaborativeTasksForViewer,
  tryMirrorNewOwnerTaskToCollaborativeStore,
  updateCollaborativeTask,
} from "@/lib/shared-category-tasks-storage";
import { getObjectivesForSharedCollaborativeTask } from "@/lib/shared-task-objectives";
import { cn } from "@/lib/utils";
import type { Category, Objective, ResponseDashboard, Tarefa, TarefaStatus } from "@/lib/types/models";

/* ─── helpers ─── */
const STATUS_META_PAGE: Record<TarefaStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "Pendente",     color: "text-brand-blue",         bg: "bg-brand-blue/10"    },
  IN_PROGRESS: { label: "Em andamento", color: "text-brand-cyan",         bg: "bg-brand-cyan/10"    },
  DONE:        { label: "Concluída",    color: "text-emerald-400",        bg: "bg-emerald-400/10"   },
  OVERDUE:     { label: "Atrasada",     color: "text-brand-pink",         bg: "bg-brand-pink/10"    },
  CANCELLED:   { label: "Cancelada",    color: "text-[var(--text-muted)]",bg: "bg-[var(--glass-bg)]"},
};

type View = "kanban" | "overdue" | "search";
type SortOverdue = "custom" | "name-asc" | "name-desc" | "date-asc" | "date-desc";

/** Escopo do quadro Kanban na aba Hoje */
type KanbanScope = "today" | "date" | "objective" | "category";

/* ─── Overdue list row ─── */
function viewerEmailTarefas(): string {
  const p = loadAjustesProfile().email.trim().toLowerCase();
  try {
    const login = String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim().toLowerCase();
    return p || login;
  } catch {
    return p;
  }
}

function mergeBaseWithCollaborative(base: Tarefa[]): Tarefa[] {
  const em = viewerEmailTarefas();
  const collab = loadCollaborativeTasksForViewer(em);
  const byId = new Map<string, Tarefa>();
  for (const t of base) byId.set(String(t.id), t);
  for (const t of collab) byId.set(String(t.id), t);
  return Array.from(byId.values());
}

function isRootKanbanTask(t: Tarefa): boolean {
  return t.idParentTask == null || t.idParentTask === "";
}

/**
 * O GET usa `YYYY-MM-DD` no fuso local; o back pode gravar `dateTask` com um dia a menos (UTC/servidor).
 * Unifica exibição e formulários ao dia pedido na requisição, sem alterar tarefas colaborativas locais.
 */
function alignTasksToFetchCalendarDay(tasks: Tarefa[], requestYmd: string): Tarefa[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestYmd)) return tasks;
  return tasks.map((t) => ({
    ...t,
    dateTask: requestYmd,
    subtasks: t.subtasks?.map((s) => ({ ...s, dateTask: requestYmd })),
  }));
}

function OverdueRow({ task, onEdit }: { task: Tarefa; onEdit: (t: Tarefa) => void }) {
  const daysLate = Math.max(
    0,
    Math.floor((Date.now() - parseLocalYmdAtNoon(task.dateTask).getTime()) / 86_400_000)
  );
  return (
    <button
      type="button"
      onClick={() => onEdit(task)}
      className="group flex w-full items-start gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-left transition-all duration-200 hover:border-brand-pink/40 hover:shadow-[0_0_0_1px_rgba(255,0,110,0.2)]"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-pink" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-brand-pink transition-colors">{task.nameTask}</p>
        {task.descriptionTask && (
          <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">{task.descriptionTask}</p>
        )}
        {task.sharedTask && (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-brand-cyan">
            <UserGroupIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Compartilhada</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="truncate text-[var(--text-muted)]">
              Por {task.sharedTask.createdByName?.trim() || task.sharedTask.createdByEmail}
            </span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span>Prevista: {parseLocalYmdAtNoon(task.dateTask).toLocaleDateString("pt-BR")}</span>
          {isTaskDisplayRecurring(task) && <span className="text-brand-pink">recorrente</span>}
        </div>
      </div>
      <span className="shrink-0 rounded-lg bg-brand-pink/15 px-2 py-1 text-xs font-bold text-brand-pink">
        {daysLate}d atraso
      </span>
    </button>
  );
}

/* ─── Page ─── */
export default function TarefasPage() {
  const router = useRouter();
  const authRedirect401Ref = useRef(false);
  const apiTasksRef = useRef<Tarefa[]>([]);

  const handleUnauthorized = useCallback(() => {
    if (!authRedirect401Ref.current) {
      authRedirect401Ref.current = true;
      router.push("/login");
      window.alert("Você não está logado, por favor faça login novamente.");
    }
  }, [router]);

  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [view, setView] = useState<View>("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
  const [sortOverdue, setSortOverdue] = useState<SortOverdue>("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTaskResult, setSearchTaskResult] = useState<Tarefa | null>(null);
  const [searchFetchLoading, setSearchFetchLoading] = useState(false);
  const [searchFetchError, setSearchFetchError] = useState<
    null | "empty" | "no_token" | "not_found" | "network" | "http" | "invalid"
  >(null);
  const [cancelPendingId, setCancelPendingId] = useState<number | string | null>(null);
  const [lateTasksFromApi, setLateTasksFromApi] = useState<Tarefa[]>([]);
  const [lateTasksLoading, setLateTasksLoading] = useState(false);
  const [lateTasksLoadError, setLateTasksLoadError] = useState(false);

  const [kanbanScope, setKanbanScope] = useState<KanbanScope>("today");
  const [scopeDate, setScopeDate] = useState(() => formatDateEnCA(new Date()));
  const [scopeObjectiveId, setScopeObjectiveId] = useState("");
  const [scopeCategoryId, setScopeCategoryId] = useState("");
  /**
   * Filtro opcional no escopo categoria (`""` = todas). Na comparação com `dateTask` usa-se **data escolhida + 1 dia**
   * (`categoryDateFilterMatchYmd` abaixo) por deslocamento API/UI neste fluxo.
   */
  const [scopeCategoryDateFilter, setScopeCategoryDateFilter] = useState("");
  const categoryDateFilterMatchYmd = useMemo(() => {
    const ymd = toDateInputValue(scopeCategoryDateFilter);
    if (!ymd) return "";
    return addOneLocalCalendarDay(ymd);
  }, [scopeCategoryDateFilter]);
  const [categoryKanbanLoading, setCategoryKanbanLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const tasksRef = useRef<Tarefa[]>([]);
  tasksRef.current = tasks;

  const loadTasksForCurrentScope = useCallback(async () => {
    if (kanbanScope !== "category") {
      setCategoryKanbanLoading(false);
    }

    let jwtToken = "";
    try {
      jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    if (!jwtToken) {
      apiTasksRef.current = [];
      setTasks(mergeBaseWithCollaborative([]));
      if (kanbanScope === "category") setCategoryKanbanLoading(false);
      // TODO (contract): usuário autenticado na UI sem token — redirecionar para `/login` ou renovar sessão.
      return;
    }

    if (kanbanScope === "objective") {
      if (!scopeObjectiveId.trim()) {
        apiTasksRef.current = [];
        setTasks(mergeBaseWithCollaborative([]));
        return;
      }
      const objResult = await fetchTasksByObjective(jwtToken, scopeObjectiveId);
      if (objResult.kind === "unauthorized") {
        handleUnauthorized();
        apiTasksRef.current = [];
        setTasks(mergeBaseWithCollaborative([]));
        return;
      }
      if (objResult.kind !== "ok") {
        // TODO (contract): toast / retry para 5xx, 429 e corpo de erro em 4xx (objetivo).
        apiTasksRef.current = [];
        setTasks(mergeBaseWithCollaborative([]));
        return;
      }
      apiTasksRef.current = objResult.tasks;
      setTasks(mergeBaseWithCollaborative(objResult.tasks));
      return;
    }

    if (kanbanScope === "category") {
      if (!scopeCategoryId.trim()) {
        setCategoryKanbanLoading(false);
        apiTasksRef.current = [];
        setTasks(mergeBaseWithCollaborative([]));
        return;
      }
      const catBase = categories.find((c) => c.id === scopeCategoryId);
      if (!catBase) {
        setCategoryKanbanLoading(false);
        apiTasksRef.current = [];
        setTasks(mergeBaseWithCollaborative([]));
        return;
      }

      setCategoryKanbanLoading(true);
      try {
        let objectives = catBase.objectives;
        if (objectives.length === 0) {
          const co = await fetchCategoryObjectives(catBase, jwtToken);
          if (co.kind === "unauthorized") {
            handleUnauthorized();
            apiTasksRef.current = [];
            setTasks(mergeBaseWithCollaborative([]));
            return;
          }
          if (co.kind !== "ok") {
            // TODO (contract): toast ao falhar objetivos da categoria; retry em 5xx/429.
            apiTasksRef.current = [];
            setTasks(mergeBaseWithCollaborative([]));
            return;
          }
          const enriched = co.category;
          objectives = enriched.objectives;
          setCategories((prev) =>
            prev.map((c) => (c.id === enriched.id ? { ...c, ...enriched } : c))
          );
        }

        if (objectives.length === 0) {
          apiTasksRef.current = [];
          setTasks(mergeBaseWithCollaborative([]));
          return;
        }

        const objResults = await Promise.all(
          objectives.map((o) => fetchTasksByObjective(jwtToken, o.id))
        );
        if (objResults.some((r) => r.kind === "unauthorized")) {
          handleUnauthorized();
          apiTasksRef.current = [];
          setTasks(mergeBaseWithCollaborative([]));
          return;
        }
        const anyFailed = objResults.some((r) => r.kind !== "ok");
        if (anyFailed) {
          // TODO (contract): toast com falhas parciais por objetivo; retry seletivo em 5xx/429.
        }
        const merged: Tarefa[] = [];
        const seen = new Set<string>();
        for (const r of objResults) {
          if (r.kind !== "ok") continue;
          for (const t of r.tasks) {
            const sid = String(t.id);
            if (seen.has(sid)) continue;
            seen.add(sid);
            merged.push(t);
          }
        }
        apiTasksRef.current = merged;
        setTasks(mergeBaseWithCollaborative(merged));
      } finally {
        setCategoryKanbanLoading(false);
      }
      return;
    }

    const dateStr = kanbanScope === "date" ? scopeDate : formatDateEnCA(new Date());

    const result = await fetchTasksByDate(jwtToken, dateStr);
    if (result.kind === "unauthorized") {
      handleUnauthorized();
      apiTasksRef.current = [];
      setTasks(mergeBaseWithCollaborative([]));
      return;
    }
    if (result.kind !== "ok") {
      // TODO (contract): toast / retry para 5xx, 429 e corpo de erro em 4xx.
      apiTasksRef.current = [];
      setTasks(mergeBaseWithCollaborative([]));
      return;
    }

    const aligned = alignTasksToFetchCalendarDay(result.tasks, dateStr);
    apiTasksRef.current = aligned;
    setTasks(mergeBaseWithCollaborative(aligned));
  }, [kanbanScope, scopeDate, scopeObjectiveId, scopeCategoryId, categories, handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadTasksForCurrentScope();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTasksForCurrentScope]);

  useEffect(() => {
    const onCollabTasks = () => {
      setTasks(mergeBaseWithCollaborative(apiTasksRef.current));
    };
    window.addEventListener("inevolving:shared-tasks-changed", onCollabTasks);
    return () => window.removeEventListener("inevolving:shared-tasks-changed", onCollabTasks);
  }, []);

  useEffect(() => {
    const refreshTasksMerge = () => {
      void loadTasksForCurrentScope();
    };
    window.addEventListener("inevolving:shared-categories-changed", refreshTasksMerge);
    return () => window.removeEventListener("inevolving:shared-categories-changed", refreshTasksMerge);
  }, [loadTasksForCurrentScope]);

  const refreshCategories = useCallback(async () => {
    const shared = loadAcceptedSharedCategories().map((x) => x.category);
    let jwtToken = "";
    try {
      jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    if (!jwtToken) {
      try {
        const r = await fetch("/api/mock/dashboard");
        const d = (await r.json()) as ResponseDashboard;
        setCategories([...(d.categoryDTOList ?? []), ...shared]);
      } catch {
        setCategories([...mockDashboard.categoryDTOList, ...shared]);
      }
      // TODO (contract): usuário na área logada sem token — alinhar com `/login` ou refresh de sessão.
      return;
    }

    const result = await fetchDashboardCategories(jwtToken);
    if (result.kind === "unauthorized") {
      handleUnauthorized();
      setCategories([...shared]);
      return;
    }
    if (result.kind === "ok") {
      setCategories([...result.data.categoryDTOList, ...shared]);
      return;
    }

    // TODO (contract): toast / retry para 5xx, 429 e mensagem em 403/404 ao listar categorias.
    try {
      const r = await fetch("/api/mock/dashboard");
      const d = (await r.json()) as ResponseDashboard;
      setCategories([...(d.categoryDTOList ?? []), ...shared]);
    } catch {
      setCategories([...mockDashboard.categoryDTOList, ...shared]);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    const onSharedChanged = () => {
      void refreshCategories();
    };
    window.addEventListener("inevolving:shared-categories-changed", onSharedChanged);
    return () => window.removeEventListener("inevolving:shared-categories-changed", onSharedChanged);
  }, [refreshCategories]);

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
        try {
          const r = await fetch("/api/mock/objetivos");
          const d = (await r.json()) as Objective[];
          if (!cancelled) setObjectives(d);
        } catch {
          if (!cancelled) setObjectives(allObjectives);
        }
        return;
      }

      const result = await fetchUserObjectives(jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        handleUnauthorized();
        setObjectives([]);
        return;
      }

      if (result.kind === "ok") {
        setObjectives(result.objectives);
        return;
      }

      // TODO (contract): mensagem padronizada em 4xx/5xx; retry em 503/429.
      setObjectives(allObjectives);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    if (view !== "overdue") return;
    let cancelled = false;
    setLateTasksLoading(true);
    setLateTasksLoadError(false);

    void (async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        if (!cancelled) {
          setLateTasksFromApi([]);
          setLateTasksLoading(false);
          setLateTasksLoadError(true);
        }
        // TODO (contract): sessão sem token na área logada — alinhar com `/login` ou refresh de sessão.
        return;
      }

      const result = await fetchTasksLate(jwtToken);
      if (cancelled) return;

      setLateTasksLoading(false);
      if (result.kind === "unauthorized") {
        handleUnauthorized();
        setLateTasksFromApi([]);
        return;
      }
      if (result.kind !== "ok") {
        // TODO (contract): toast / retry para 5xx, 429 e corpo de erro em 4xx (atrasadas).
        setLateTasksLoadError(true);
        setLateTasksFromApi([]);
        return;
      }

      setLateTasksLoadError(false);
      setLateTasksFromApi(result.tasks.filter((t) => t.status === "OVERDUE"));
    })();

    return () => {
      cancelled = true;
    };
  }, [view, handleUnauthorized]);

  const runSearchByTaskId = useCallback(async () => {
    const raw = searchQuery.trim();
    setSearchTaskResult(null);
    setSearchFetchError(null);
    if (!raw) {
      setSearchFetchError("empty");
      return;
    }
    let jwtToken = "";
    try {
      jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }
    if (!jwtToken) {
      setSearchFetchError("no_token");
      // TODO (contract): redirecionar para `/login` se a rota exigir sessão.
      return;
    }

    setSearchFetchLoading(true);
    const result = await fetchTaskById(jwtToken, raw);
    setSearchFetchLoading(false);

    if (result.kind === "unauthorized") {
      handleUnauthorized();
      return;
    }
    if (result.kind === "not_found") {
      setSearchFetchError("not_found");
      return;
    }
    if (result.kind === "ok") {
      setSearchTaskResult(result.task);
      return;
    }
    if (result.kind === "invalid_body") {
      setSearchFetchError("invalid");
      return;
    }
    if (result.kind === "network_error") {
      setSearchFetchError("network");
      return;
    }
    // TODO (contract): toast com status HTTP e corpo de erro quando padronizado.
    setSearchFetchError("http");
  }, [searchQuery, handleUnauthorized]);

  const applyStatusChange = async (
    id: number | string,
    status: TarefaStatus,
    cancellationReason?: string
  ) => {
    const current = tasksRef.current.find((x) => String(x.id) === String(id));
    if (current && isTaskBlockedByObjectiveForEdit(current)) return;

    if (current?.sharedTask) {
      const updated = updateCollaborativeTask(id, {
        status,
        ...(status === "CANCELLED" && cancellationReason !== undefined && cancellationReason !== ""
          ? { cancellationReason }
          : {}),
        ...(status !== "CANCELLED" ? { cancellationReason: undefined } : {}),
      });
      if (updated) {
        setTasks((prev) => prev.map((t) => (String(t.id) === String(id) ? updated : t)));
        setSearchTaskResult((prev) =>
          prev && String(prev.id) === String(id) ? updated : prev
        );
      }
      return;
    }

    const sid = String(id);
    setSearchTaskResult((prev) => {
      if (!prev || String(prev.id) !== sid) return prev;
      const next: Tarefa = { ...prev, status };
      if (status === "CANCELLED" && cancellationReason !== undefined) {
        next.cancellationReason = cancellationReason;
      } else if (status !== "CANCELLED") {
        delete next.cancellationReason;
      }
      return next;
    });
    setLateTasksFromApi((prev) => {
      if (status !== "OVERDUE") {
        return prev.filter((x) => String(x.id) !== sid);
      }
      return prev.map((x) => (String(x.id) === sid ? { ...x, status } : x));
    });

    setTasks((prev) =>
      prev.map((t) => {
        if (String(t.id) !== String(id)) return t;
        const next: Tarefa = { ...t, status };
        if (status === "CANCELLED" && cancellationReason !== undefined) {
          next.cancellationReason = cancellationReason;
        } else if (status !== "CANCELLED") {
          delete next.cancellationReason;
        }
        const idx = apiTasksRef.current.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) {
          const arr = [...apiTasksRef.current];
          arr[idx] = next;
          apiTasksRef.current = arr;
        }
        return next;
      })
    );
    try {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }
      if (!jwtToken) {
        void loadTasksForCurrentScope();
        return;
      }

      const patchRes = await patchTaskStatus(
        jwtToken,
        id,
        status,
        status === "CANCELLED" ? cancellationReason : undefined
      );

      if (patchRes.kind === "unauthorized") {
        handleUnauthorized();
        void loadTasksForCurrentScope();
        return;
      }
      if (patchRes.kind === "invalid_cancellation") {
        void loadTasksForCurrentScope();
        return;
      }
      if (patchRes.kind === "network_error") {
        window.alert("Falha de conexão ao atualizar o status.");
        void loadTasksForCurrentScope();
        return;
      }
      if (patchRes.kind !== "ok" && patchRes.kind !== "ok_no_body") {
        window.alert("Não foi possível atualizar o status. Tente novamente.");
        void loadTasksForCurrentScope();
        return;
      }

      if (patchRes.kind === "ok" && patchRes.task) {
        const t = patchRes.task;
        setTasks((prev) => prev.map((x) => (String(x.id) === sid ? { ...x, ...t } : x)));
        setSearchTaskResult((prev) =>
          prev && String(prev.id) === sid ? { ...prev, ...t } : prev
        );
        setLateTasksFromApi((prev) => {
          if (t.status === "OVERDUE") {
            const exists = prev.some((x) => String(x.id) === sid);
            if (exists) return prev.map((x) => (String(x.id) === sid ? { ...x, ...t } : x));
            return [...prev, t];
          }
          return prev.filter((x) => String(x.id) !== sid);
        });
        const idx = apiTasksRef.current.findIndex((x) => String(x.id) === sid);
        if (idx >= 0) {
          const arr = [...apiTasksRef.current];
          arr[idx] = { ...arr[idx], ...t };
          apiTasksRef.current = arr;
        }
      }
    } catch {
      window.alert("Falha de conexão ao atualizar o status.");
      void loadTasksForCurrentScope();
    }
  };

  const changeStatus = (id: number | string, status: TarefaStatus) => {
    if (status === "CANCELLED") {
      setCancelPendingId(id);
      return;
    }
    void applyStatusChange(id, status);
  };

  const taskPendingCancel =
    cancelPendingId != null
      ? tasks.find((t) => String(t.id) === String(cancelPendingId)) ??
        lateTasksFromApi.find((t) => String(t.id) === String(cancelPendingId))
      : null;

  const objectivesForOwnerNova = useMemo(() => {
    const ownedCats = categories.filter((c) => !c.sharedFrom);
    const ids = new Set<string>();
    for (const c of ownedCats) {
      c.objectives.forEach((o) => ids.add(String(o.id)));
    }
    if (ids.size > 0) {
      return objectives.filter((o) => ids.has(String(o.id)));
    }
    // O GET de categorias costuma vir sem `objectives` preenchido até um fetch por categoria;
    // sem isso a interseção fica vazia e o modal de nova tarefa bloqueia indevidamente.
    if (ownedCats.length > 0) {
      return objectives.filter((o) => o.statusObjective === "IN_PROGRESS");
    }
    return [];
  }, [categories, objectives]);

  const handleCreated = (task: Tarefa) => {
    const profile = loadAjustesProfile();
    const em = viewerEmailTarefas();
    const owned = categories
      .filter((c) => !c.sharedFrom)
      .map((c) => ({ id: c.id, objectives: c.objectives }));
    const mirrored = tryMirrorNewOwnerTaskToCollaborativeStore(task, em, profile.name, owned);
    if (mirrored) {
      setTasks((prev) => [mirrored, ...prev]);
      return;
    }
    setTasks((prev) => [task, ...prev]);
    if (!task.sharedTask) {
      apiTasksRef.current = [task, ...apiTasksRef.current];
    }
  };

  const handleSaved = (updated: Tarefa) => {
    const sid = String(updated.id);
    setSearchTaskResult((prev) => (prev && String(prev.id) === sid ? updated : prev));
    setLateTasksFromApi((prev) => {
      if (updated.status !== "OVERDUE") {
        return prev.filter((x) => String(x.id) !== sid);
      }
      const exists = prev.some((x) => String(x.id) === sid);
      if (exists) return prev.map((x) => (String(x.id) === sid ? updated : x));
      return [...prev, updated];
    });
    setTasks((prev) => {
      const next = prev.map((t) => (String(t.id) === String(updated.id) ? updated : t));
      if (!updated.sharedTask) {
        const idx = apiTasksRef.current.findIndex((x) => String(x.id) === String(updated.id));
        if (idx >= 0) {
          const arr = [...apiTasksRef.current];
          arr[idx] = updated;
          apiTasksRef.current = arr;
        }
      }
      return next;
    });
  };

  const handleDeletedTask = (taskId: number | string, meta?: { seriesRemoved?: boolean }) => {
    const sid = String(taskId);
    setSearchTaskResult((prev) => (prev && String(prev.id) === sid ? null : prev));
    setLateTasksFromApi((prev) => prev.filter((t) => String(t.id) !== sid));
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(taskId)));
    apiTasksRef.current = apiTasksRef.current.filter((t) => String(t.id) !== String(taskId));
    if (meta?.seriesRemoved) {
      void loadTasksForCurrentScope();
    }
  };

  const editObjectiveOverride = useMemo((): Objective[] | undefined => {
    if (!editingTask?.sharedTask) return undefined;
    const obs = getObjectivesForSharedCollaborativeTask(editingTask, categories);
    if (obs && obs.length > 0) return obs;
    const one = objectives.find((o) => String(o.id) === String(editingTask.idObjective));
    return one ? [one] : [];
  }, [editingTask, categories, objectives]);

  const objectiveIdsForCategory = useMemo(() => {
    const cat = categories.find((c) => c.id === scopeCategoryId);
    if (!cat) return new Set<string>();
    return new Set(cat.objectives.map((o) => String(o.id)));
  }, [categories, scopeCategoryId]);

  const kanbanTasks = useMemo(() => {
    const roots = (list: Tarefa[]) => list.filter(isRootKanbanTask);
    let slice: Tarefa[];
    switch (kanbanScope) {
      case "today":
        slice = tasks;
        break;
      case "date":
        slice = tasks.filter((t) => taskDateToLocalCalendarYmd(t.dateTask) === scopeDate);
        break;
      case "objective":
        if (!scopeObjectiveId) return [];
        slice = tasks.filter((t) => String(t.idObjective) === String(scopeObjectiveId));
        break;
      case "category":
        if (!scopeCategoryId || objectiveIdsForCategory.size === 0) return [];
        slice = tasks
          .filter((t) => objectiveIdsForCategory.has(String(t.idObjective)))
          .filter((t) => !isTaskBlockedByObjectiveForEdit(t));
        if (categoryDateFilterMatchYmd) {
          slice = slice.filter(
            (t) => taskDateToLocalCalendarYmd(t.dateTask) === categoryDateFilterMatchYmd
          );
        }
        break;
      default:
        slice = tasks;
    }
    return roots(slice);
  }, [
    tasks,
    kanbanScope,
    scopeDate,
    scopeObjectiveId,
    scopeCategoryId,
    scopeCategoryDateFilter,
    categoryDateFilterMatchYmd,
    objectiveIdsForCategory,
  ]);

  const kanbanFilterHint = useMemo(() => {
    const hojeStr = formatDateEnCA(new Date());
    switch (kanbanScope) {
      case "today":
        return `Tarefas do dia ${parseLocalYmdAtNoon(hojeStr).toLocaleDateString("pt-BR")}`;
      case "date":
        return `Tarefas na data ${parseLocalYmdAtNoon(scopeDate).toLocaleDateString("pt-BR")}`;
      case "objective": {
        const o = objectives.find((x) => String(x.id) === String(scopeObjectiveId));
        return scopeObjectiveId && o
          ? `Tarefas do objetivo «${o.nameObjective}»`
          : "Selecione um objetivo para listar as tarefas";
      }
      case "category": {
        const c = categories.find((x) => x.id === scopeCategoryId);
        if (!scopeCategoryId || !c) return "Selecione uma categoria para listar as tarefas";
        if (categoryDateFilterMatchYmd) {
          return `Categoria «${c.categoryName}» · data ${parseLocalYmdAtNoon(categoryDateFilterMatchYmd).toLocaleDateString("pt-BR")}`;
        }
        return `Todas as tarefas da categoria «${c.categoryName}» (qualquer data)`;
      }
      default:
        return "";
    }
  }, [
    kanbanScope,
    scopeDate,
    scopeObjectiveId,
    scopeCategoryId,
    scopeCategoryDateFilter,
    categoryDateFilterMatchYmd,
    objectives,
    categories,
  ]);

  const scopeTabs: { key: KanbanScope; label: string; icon: React.ElementType }[] = [
    { key: "today", label: "Hoje", icon: CalendarDaysIcon },
    { key: "date", label: "Por data", icon: CalendarDaysIcon },
    { key: "objective", label: "Por objetivo", icon: FlagIcon },
    { key: "category", label: "Por categoria", icon: Squares2X2Icon },
  ];

  /* Atrasadas: GET /auth/api/tasks/late + tarefas colaborativas OVERDUE (local). `tasks` no deps para atualizar após eventos de merge. */
  const overdueTasks = useMemo(() => {
    const em = viewerEmailTarefas();
    const collabOverdue = loadCollaborativeTasksForViewer(em).filter((t) => t.status === "OVERDUE");
    const byId = new Map<string, Tarefa>();
    for (const t of lateTasksFromApi) {
      if (t.status === "OVERDUE") byId.set(String(t.id), t);
    }
    for (const t of collabOverdue) byId.set(String(t.id), t);
    const base = Array.from(byId.values());
    switch (sortOverdue) {
      case "name-asc":
        return [...base].sort((a, b) => a.nameTask.localeCompare(b.nameTask));
      case "name-desc":
        return [...base].sort((a, b) => b.nameTask.localeCompare(a.nameTask));
      case "date-asc":
        return [...base].sort((a, b) => a.dateTask.localeCompare(b.dateTask));
      case "date-desc":
        return [...base].sort((a, b) => b.dateTask.localeCompare(a.dateTask));
      default:
        return base;
    }
  }, [lateTasksFromApi, sortOverdue, tasks]);

  const viewTabs: { key: View; label: string; icon: React.ElementType }[] = [
    { key: "kanban",  label: "Quadro",    icon: ViewColumnsIcon },
    { key: "overdue", label: "Atrasadas", icon: ExclamationTriangleIcon },
    { key: "search",  label: "Buscar",    icon: MagnifyingGlassIcon },
  ];

  return (
    <>
      <NovaTarefaModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={handleCreated}
        objectivesForSelect={objectivesForOwnerNova}
        contextSubtitle={
          objectivesForOwnerNova.length === 0
            ? "Você só pode criar tarefas aqui para objetivos das suas categorias próprias. Para categorias compartilhadas, use a página da categoria (Dashboard → Ver detalhes)."
            : "Apenas objetivos das suas categorias próprias. Tarefas em categorias que você compartilhou também ficam visíveis aos convidados."
        }
      />
      <EditarTarefaModal
        open={editingTask !== null}
        task={editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        onSaved={handleSaved}
        objectiveOptionsOverride={editObjectiveOverride}
        viewerEmail={viewerEmailTarefas()}
        onDeleted={handleDeletedTask}
      />

      <CancelarTarefaModal
        open={taskPendingCancel != null}
        onOpenChange={(open) => {
          if (!open) setCancelPendingId(null);
        }}
        taskName={taskPendingCancel?.nameTask ?? ""}
        idObjective={taskPendingCancel?.idObjective ?? ""}
        onConfirm={(reasonsRaw) => {
          if (taskPendingCancel == null) return;
          recordCancellationReasons(taskPendingCancel.idObjective, reasonsRaw);
          void applyStatusChange(taskPendingCancel.id, "CANCELLED", reasonsRaw);
          setCancelPendingId(null);
        }}
      />

      <div className="mx-auto max-w-7xl space-y-5 pt-4 md:pt-6">
        {/* ── Cabeçalho ── */}
        <FadeInView>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tarefas</h1>
              {/* <p className="mt-1 text-sm text-[var(--text-muted)]">
                Mock —{" "}
                <code className="rounded bg-black/5 px-1 text-xs dark:bg-white/10">GET /auth/api/tasks/{"{data}"}</code>
              </p> */}
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg active:scale-95 dark:from-brand-purple dark:to-brand-pink"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden />
              Nova tarefa
            </button>
          </div>
        </FadeInView>

        {/* ── Tabs de view ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {viewTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                view === key
                  ? "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow dark:from-brand-purple dark:to-brand-pink"
                  : "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              {key === "overdue" && overdueTasks.length > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  view === key ? "bg-white/20 text-white" : "bg-brand-pink/20 text-brand-pink"
                )}>
                  {overdueTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ══════════ KANBAN ══════════ */}
          {view === "kanban" && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/80 p-4 backdrop-blur-glass">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <FunnelIcon className="h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Filtro do quadro
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scopeTabs.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setKanbanScope(key);
                        if (key === "date" && !scopeDate) setScopeDate(formatDateEnCA(new Date()));
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                        kanbanScope === key
                          ? "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow dark:from-brand-purple dark:to-brand-pink"
                          : "border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>

                {kanbanScope === "date" && (
                  <div className="mt-4 max-w-xs">
                    <label htmlFor="kanban-scope-date" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      Data das tarefas
                    </label>
                    <DateField
                      id="kanban-scope-date"
                      value={scopeDate}
                      onChange={(e) => setScopeDate(e.target.value)}
                    />
                  </div>
                )}

                {kanbanScope === "objective" && (
                  <div className="mt-4 max-w-md">
                    <label htmlFor="kanban-scope-obj" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      Objetivo
                    </label>
                    <GlassSelect
                      id="kanban-scope-obj"
                      value={scopeObjectiveId}
                      onChange={(e) => setScopeObjectiveId(e.target.value)}
                    >
                      <option value="">Selecione um objetivo…</option>
                      {objectives.map((o) => (
                        <option key={String(o.id)} value={String(o.id)}>
                          {o.nameObjective}
                        </option>
                      ))}
                    </GlassSelect>
                  </div>
                )}

                {kanbanScope === "category" && (
                  <div className="mt-4 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                    <div className="min-w-0">
                      <label htmlFor="kanban-scope-cat" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                        Categoria
                      </label>
                      <GlassSelect
                        id="kanban-scope-cat"
                        value={scopeCategoryId}
                        onChange={(e) => setScopeCategoryId(e.target.value)}
                      >
                        <option value="">Selecione uma categoria…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.categoryName}
                          </option>
                        ))}
                      </GlassSelect>
                    </div>
                    <div className="min-w-0">
                      <label
                        htmlFor="kanban-scope-cat-date"
                        className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        Filtrar por data
                        <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">(opcional)</span>
                      </label>
                      <p className="mb-2 text-xs text-[var(--text-muted)]">
                        Com data: a comparação usa a data do campo <span className="font-semibold text-brand-cyan">+ 1 dia</span>{" "}
                        (veja o resumo abaixo). Vazio: todas as tarefas da categoria.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <DateField
                          id="kanban-scope-cat-date"
                          className="min-w-0 flex-1"
                          value={scopeCategoryDateFilter}
                          onChange={(e) => setScopeCategoryDateFilter(e.target.value)}
                          disabled={!scopeCategoryId.trim()}
                          aria-disabled={!scopeCategoryId.trim()}
                        />
                        {scopeCategoryDateFilter.trim() ? (
                          <button
                            type="button"
                            onClick={() => setScopeCategoryDateFilter("")}
                            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
                          >
                            <XCircleIcon className="h-4 w-4" aria-hidden />
                            Todas as datas
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <TagIcon className="h-3.5 w-3.5 shrink-0 text-brand-cyan/80" aria-hidden />
                  {kanbanFilterHint}
                  <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
                    {kanbanScope === "category" &&
                    categoryKanbanLoading &&
                    scopeCategoryId.trim() ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-cyan" aria-hidden />
                        <span className="text-[var(--text-muted)]">Carregando…</span>
                      </>
                    ) : (
                      <>{kanbanTasks.length} tarefa(s)</>
                    )}
                  </span>
                </p>
              </div>

              <div className="relative min-h-[min(60vh,28rem)]">
                <AnimatePresence mode="wait">
                  {kanbanScope === "category" &&
                  categoryKanbanLoading &&
                  scopeCategoryId.trim() ? (
                    <motion.div
                      key="category-kanban-loading"
                      role="status"
                      aria-live="polite"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="flex min-h-[min(60vh,28rem)] flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/85 px-6 py-16 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    >
                      <motion.span
                        className="relative flex h-14 w-14 items-center justify-center"
                        aria-hidden
                        initial={{ scale: 0.92 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      >
                        <span className="absolute inset-0 rounded-full bg-brand-cyan/15 blur-md" />
                        <ArrowPathIcon className="relative h-9 w-9 animate-spin text-brand-cyan" />
                      </motion.span>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Carregando tarefas da categoria…
                      </p>
                      <p className="max-w-sm text-xs text-[var(--text-muted)]">
                        Agregando tarefas de todos os objetivos desta categoria.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="category-kanban-board"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <KanbanBoard
                        tasks={kanbanTasks}
                        onStatusChange={changeStatus}
                        onEdit={setEditingTask}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ══════════ ATRASADAS ══════════ */}
          {view === "overdue" && (
            <motion.div
              key="overdue"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* ordenação */}
              <div className="flex flex-wrap items-center gap-2">
                <ArrowsUpDownIcon className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <span className="text-xs font-medium text-[var(--text-muted)]">Ordenar:</span>
                {(
                  [
                    { v: "custom"    as SortOverdue, l: "Padrão"      },
                    { v: "name-asc"  as SortOverdue, l: "Nome A→Z"    },
                    { v: "name-desc" as SortOverdue, l: "Nome Z→A"    },
                    { v: "date-asc"  as SortOverdue, l: "Data (mais antiga)" },
                    { v: "date-desc" as SortOverdue, l: "Data (mais recente)" },
                  ] as const
                ).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSortOverdue(v)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      sortOverdue === v
                        ? "bg-brand-pink/20 text-brand-pink"
                        : "border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-brand-pink/30 hover:text-brand-pink"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {lateTasksLoading ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/60 py-12 text-center">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-brand-pink/70" aria-hidden />
                  <p className="text-sm text-[var(--text-muted)]">Carregando tarefas atrasadas…</p>
                </div>
              ) : lateTasksLoadError ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-pink/30 py-12 text-center">
                  <ExclamationTriangleIcon className="h-9 w-9 text-brand-pink/70" aria-hidden />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Não foi possível carregar as atrasadas</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Verifique se você está logado e sua conexão. Abra a aba novamente para tentar de novo.
                  </p>
                </div>
              ) : overdueTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-400/30 py-14 text-center">
                  <CheckCircleIcon className="h-10 w-10 text-emerald-400/60" aria-hidden />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma tarefa atrasada!</p>
                  <p className="text-xs text-[var(--text-muted)]">Você está em dia com todas as tarefas.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {overdueTasks.map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <OverdueRow task={t} onEdit={setEditingTask} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ BUSCAR ══════════ */}
          {view === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <p className="text-center text-xs text-[var(--text-muted)]">
                Busca por ID no servidor:{" "}
                <code className="rounded bg-black/5 px-1 font-mono text-[11px] dark:bg-white/10">
                  GET /auth/api/tasks/task/{"{id}"}
                </code>
              </p>

              {/* input de busca */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 transition-[box-shadow,border-color] duration-[380ms] focus-within:border-brand-cyan focus-within:shadow-[0_0_0_3px_rgba(0,188,212,0.2)]">
                  <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runSearchByTaskId();
                    }}
                    placeholder="ID ou UUID da tarefa…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    autoFocus
                    aria-label="ID da tarefa"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchTaskResult(null);
                        setSearchFetchError(null);
                      }}
                      className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      aria-label="Limpar"
                    >
                      <XCircleIcon className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={searchFetchLoading}
                  onClick={() => void runSearchByTaskId()}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200",
                    searchFetchLoading
                      ? "cursor-not-allowed border border-[var(--glass-border)] text-[var(--text-muted)]"
                      : "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow hover:shadow-glass-lg active:scale-[0.98] dark:from-brand-purple dark:to-brand-pink"
                  )}
                >
                  {searchFetchLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
                      Buscando…
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {!searchQuery.trim() && !searchFetchLoading && !searchTaskResult && searchFetchError == null && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Informe o identificador da tarefa e clique em <span className="font-medium">Buscar</span> (ou Enter).
                </p>
              )}

              {searchFetchError === "empty" && (
                <p className="text-center text-sm text-brand-pink" role="alert">
                  Digite um ID antes de buscar.
                </p>
              )}
              {searchFetchError === "no_token" && (
                <p className="text-center text-sm text-brand-pink" role="alert">
                  Faça login para buscar tarefas na API.
                </p>
              )}
              {searchFetchError === "not_found" && (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Nenhuma tarefa encontrada para{" "}
                  <code className="rounded bg-black/5 px-1 font-mono dark:bg-white/10">{searchQuery.trim()}</code>.
                </p>
              )}
              {searchFetchError === "invalid" && (
                <p className="text-center text-sm text-brand-pink" role="alert">
                  Resposta da API em formato inesperado. Tente novamente ou contate o suporte.
                </p>
              )}
              {searchFetchError === "network" && (
                <p className="text-center text-sm text-brand-pink" role="alert">
                  Falha de rede. Verifique sua conexão e tente de novo.
                </p>
              )}
              {searchFetchError === "http" && (
                <p className="text-center text-sm text-brand-pink" role="alert">
                  Não foi possível concluir a busca. Tente novamente em instantes.
                </p>
              )}

              {searchTaskResult && (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const t = searchTaskResult;
                    const meta = STATUS_META_PAGE[t.status];
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditingTask(t)}
                        className="flex w-full flex-col gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-left transition-all duration-200 hover:border-brand-cyan/40"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h2 className="font-semibold text-[var(--text-primary)]">{t.nameTask}</h2>
                          <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-bold", meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                        </div>
                        {t.descriptionTask && (
                          <p className="text-sm text-[var(--text-muted)]">{t.descriptionTask}</p>
                        )}
                        <p className="font-mono text-xs text-[var(--text-muted)]">
                          ID: <span className="text-brand-cyan">{t.uuid}</span>
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                          <span>Data: {parseLocalYmdAtNoon(t.dateTask).toLocaleDateString("pt-BR")}</span>
                          {isTaskDisplayRecurring(t) && (
                            <span className="flex items-center gap-1 text-brand-purple dark:text-brand-pink">
                              <ArrowPathIcon className="h-3 w-3" aria-hidden />
                              recorrente
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
