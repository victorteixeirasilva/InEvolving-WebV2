import { formatDateEnCA, toDateInputValue } from "@/lib/tasks/format-task-date-local";
import type { Tarefa, TarefaStatus, TarefaSubtarefa } from "@/lib/types/models";

function parseStatus(raw: unknown): TarefaStatus {
  const s = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  switch (s) {
    case "TODO":
    case "PENDING":
      return "PENDING";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "DONE":
      return "DONE";
    case "OVERDUE":
    case "LATE":
      return "OVERDUE";
    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
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

/**
 * Normaliza um item bruto retornado pela API de subtarefas (`GET/POST /auth/api/tasks/subtask/…`)
 * para o formato `TarefaSubtarefa` usado na UI.
 */
export function normalizeApiSubtask(raw: unknown): TarefaSubtarefa | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : null;
  if (!id) return null;

  const nameTask = typeof o.nameTask === "string" ? o.nameTask.trim() : "";
  if (!nameTask) return null;

  const descriptionTask = typeof o.descriptionTask === "string" ? o.descriptionTask.trim() : "";
  const status = parseStatus(o.status);
  const dateTask = toDateInputValue(String(o.dateTask ?? "")) || String(o.dateTask ?? "");

  let idObjective: number | string = "";
  if (typeof o.idObjective === "string" && o.idObjective.trim()) idObjective = o.idObjective.trim();
  else if (typeof o.idObjective === "number" && Number.isFinite(o.idObjective)) idObjective = o.idObjective;

  const idParentTask =
    typeof o.idParentTask === "string" ? o.idParentTask.trim() || null : null;

  const cancellationReason =
    typeof o.cancellationReason === "string" ? o.cancellationReason : null;

  return {
    id,
    nameTask,
    descriptionTask,
    dateTask,
    status,
    idObjective,
    idParentTask,
    cancellationReason,
  };
}
