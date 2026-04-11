import type { Tarefa } from "@/lib/types/models";

function hasOriginalTaskRef(value: Tarefa["idOriginalTask"]): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  const s = String(value).trim();
  return s.length > 0;
}

/**
 * Se a tarefa deve ser exibida como recorrente (badge, ícone, formulário inicial).
 * Além de `isRecurring`, considera instâncias da API (`isCopy`, `idOriginalTask`).
 */
export function isTaskDisplayRecurring(task: Tarefa): boolean {
  if (task.isRecurring === true) return true;
  if (task.isCopy === true) return true;
  return hasOriginalTaskRef(task.idOriginalTask);
}
