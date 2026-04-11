import type { Tarefa } from "@/lib/types/models";

/**
 * Objetivo concluído bloqueia edição/alteração de status, exceto quando a tarefa está atrasada (`OVERDUE`).
 */
export function isTaskBlockedByObjectiveForEdit(task: Tarefa): boolean {
  if (!task.blockedByObjective) return false;
  return task.status !== "OVERDUE";
}
