import { STORAGE_KEYS } from "@/lib/constants";
import type { Tarefa, TarefaStatus } from "@/lib/types/models";

const COLS: TarefaStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "OVERDUE",
  "CANCELLED",
];

export function emptyKanbanOrder(): Record<TarefaStatus, string[]> {
  return {
    PENDING: [],
    IN_PROGRESS: [],
    DONE: [],
    OVERDUE: [],
    CANCELLED: [],
  };
}

function toOrderId(x: unknown): string | null {
  if (typeof x === "string" && x.trim()) return x.trim();
  if (typeof x === "number" && Number.isFinite(x)) return String(x);
  return null;
}

export function loadKanbanOrder(): Record<TarefaStatus, string[]> {
  if (typeof window === "undefined") return emptyKanbanOrder();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tarefasKanbanOrder);
    if (!raw) return emptyKanbanOrder();
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const result = emptyKanbanOrder();
    for (const s of COLS) {
      const arr = parsed[s];
      const ids: string[] = [];
      if (Array.isArray(arr)) {
        for (const x of arr) {
          const id = toOrderId(x);
          if (id) ids.push(id);
        }
      }
      result[s] = ids;
    }
    return result;
  } catch {
    return emptyKanbanOrder();
  }
}

export function saveKanbanOrder(order: Record<TarefaStatus, string[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.tarefasKanbanOrder, JSON.stringify(order));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Mantém a ordem salva para ids ainda na coluna; ids novos entram ao final (estável por id). */
export function reconcileOrderWithTasks(
  order: Record<TarefaStatus, string[]>,
  tasks: Pick<Tarefa, "id" | "status">[]
): Record<TarefaStatus, string[]> {
  const next = emptyKanbanOrder();
  for (const status of COLS) {
    const validIds = new Set(
      tasks.filter((t) => t.status === status).map((t) => String(t.id))
    );
    const prev = order[status] ?? [];
    const merged: string[] = [];
    for (const id of prev) {
      if (validIds.has(id)) {
        merged.push(id);
        validIds.delete(id);
      }
    }
    const rest = Array.from(validIds).sort((a, b) => a.localeCompare(b));
    next[status] = [...merged, ...rest];
  }
  return next;
}

export function orderedTasksForStatus(
  status: TarefaStatus,
  tasks: Tarefa[],
  order: Record<TarefaStatus, string[]>
): Tarefa[] {
  const inColumn = tasks.filter((t) => t.status === status);
  const byId = new Map(inColumn.map((t) => [String(t.id), t]));
  const ids = order[status] ?? [];
  const out: Tarefa[] = [];
  for (const id of ids) {
    const t = byId.get(id);
    if (t) out.push(t);
  }
  if (out.length === 0 && inColumn.length > 0) {
    return [...inColumn].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }
  return out;
}
