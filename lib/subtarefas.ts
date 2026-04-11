import { formatDateEnCA, toDateInputValue } from "@/lib/tasks/format-task-date-local";
import type { Tarefa, TarefaStatus, TarefaSubtarefa } from "@/lib/types/models";

const VALID_STATUS: TarefaStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE", "CANCELLED"];

function parseStatus(raw: unknown): TarefaStatus {
  const s = String(raw ?? "");
  return VALID_STATUS.includes(s as TarefaStatus) ? (s as TarefaStatus) : "PENDING";
}

export function createSubtaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `st-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Converte checklist legado (title/done) ou garante formato de tarefa completa. */
export function migrateSubtasksFromParent(raw: Tarefa["subtasks"], parent: Tarefa): TarefaSubtarefa[] {
  if (!raw || raw.length === 0) return [];
  const out: TarefaSubtarefa[] = [];
  for (const x of raw as unknown[]) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "").trim() || createSubtaskId();
    if ("nameTask" in o && typeof o.nameTask === "string") {
      const nameTask = String(o.nameTask ?? "").trim();
      if (!nameTask) continue;
      out.push({
        id,
        nameTask,
        descriptionTask: String(o.descriptionTask ?? "").trim(),
        dateTask: (() => {
          const v = toDateInputValue(String(o.dateTask ?? ""));
          return v || parent.dateTask;
        })(),
        status: parseStatus(o.status),
        idObjective: parent.idObjective,
      });
      continue;
    }
    const title = String((o as { title?: string }).title ?? "").trim();
    if (!title) continue;
    out.push({
      id,
      nameTask: title,
      descriptionTask: "",
      dateTask: parent.dateTask,
      status: Boolean((o as { done?: boolean }).done) ? "DONE" : "PENDING",
      idObjective: parent.idObjective,
    });
  }
  return out;
}

export function normalizeSubtasksFromPayload(raw: unknown, fallbackObjective: number, fallbackDate: string): TarefaSubtarefa[] {
  if (!Array.isArray(raw)) return [];
  const out: TarefaSubtarefa[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? "").trim() || createSubtaskId();
    const nameTask = String(o.nameTask ?? (o as { title?: string }).title ?? "").trim();
    if (!nameTask) continue;
    const dateRaw = toDateInputValue(String(o.dateTask ?? ""));
    out.push({
      id,
      nameTask,
      descriptionTask: String(o.descriptionTask ?? "").trim(),
      dateTask: dateRaw || fallbackDate,
      status: parseStatus(o.status ?? ((o as { done?: boolean }).done ? "DONE" : "PENDING")),
      idObjective: Number.isFinite(Number(o.idObjective)) ? Number(o.idObjective) : fallbackObjective,
    });
  }
  return out;
}

export function subtasksProgress(task: Tarefa): { done: number; total: number } | null {
  const list = task.subtasks;
  if (!list || list.length === 0) return null;
  const total = list.length;
  const done = list.filter((s) => s.status === "DONE").length;
  return { done, total };
}

export function stripEmptySubtasks(list: TarefaSubtarefa[]): TarefaSubtarefa[] {
  return list
    .map((s) => ({
      id: s.id?.trim() || createSubtaskId(),
      nameTask: s.nameTask.trim(),
      descriptionTask: (s.descriptionTask ?? "").trim(),
      dateTask: /^\d{4}-\d{2}-\d{2}$/.test(s.dateTask) ? s.dateTask : formatDateEnCA(new Date()),
      status: parseStatus(s.status),
      idObjective: s.idObjective,
    }))
    .filter((s) => s.nameTask.length > 0);
}

export function syncSubtasksObjective(list: TarefaSubtarefa[], idObjective: number | string): TarefaSubtarefa[] {
  return list.map((s) => ({ ...s, idObjective }));
}
