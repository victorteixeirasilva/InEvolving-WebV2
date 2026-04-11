import type { TarefaStatus, TarefaSubtarefa } from "@/lib/types/models";

const COLS: TarefaStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE", "CANCELLED"];

export function emptySubtaskKanbanOrder(): Record<TarefaStatus, string[]> {
  return {
    PENDING: [],
    IN_PROGRESS: [],
    DONE: [],
    OVERDUE: [],
    CANCELLED: [],
  };
}

export function reconcileSubtaskOrderWithSubtasks(
  order: Record<TarefaStatus, string[]>,
  subtasks: Pick<TarefaSubtarefa, "id" | "status">[]
): Record<TarefaStatus, string[]> {
  const next = emptySubtaskKanbanOrder();
  for (const status of COLS) {
    const validIds = new Set(subtasks.filter((t) => t.status === status).map((t) => t.id));
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

export function orderedSubtasksForStatus(
  status: TarefaStatus,
  subtasks: TarefaSubtarefa[],
  order: Record<TarefaStatus, string[]>
): TarefaSubtarefa[] {
  const inColumn = subtasks.filter((t) => t.status === status);
  const byId = new Map(inColumn.map((t) => [t.id, t]));
  const ids = order[status] ?? [];
  const out: TarefaSubtarefa[] = [];
  for (const id of ids) {
    const t = byId.get(id);
    if (t) out.push(t);
  }
  if (out.length === 0 && inColumn.length > 0) {
    return [...inColumn].sort((a, b) => a.id.localeCompare(b.id));
  }
  return out;
}
