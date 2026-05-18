import { fetchTaskResponsible } from "@/lib/tasks/fetch-task-responsible";
import type { Tarefa, TarefaSubtarefa } from "@/lib/types/models";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ResponsibleEntity = {
  idUser?: number | string;
  idResponsibleUser?: string | null;
  sharedTask?: Tarefa["sharedTask"];
};

export function normalizeUserId(id: number | string | null | undefined): string | null {
  if (id == null) return null;
  const s = String(id).trim();
  return s.length > 0 ? s.toLowerCase() : null;
}

export function isApiTaskUuid(id: string | number | undefined): boolean {
  if (id == null) return false;
  return UUID_RE.test(String(id).trim());
}

/** ID persistido na API (não IDs locais temporários de subtarefa). */
export function getTaskApiId(task: { id: number | string; uuid?: string }): string | null {
  const raw = String(task.uuid ?? task.id).trim();
  return isApiTaskUuid(raw) ? raw : null;
}

export function isExplicitResponsibleAssignment(idResponsibleUser: string | null | undefined): boolean {
  return idResponsibleUser != null && String(idResponsibleUser).trim().length > 0;
}

export function getEffectiveResponsibleId(
  entity: ResponsibleEntity,
  idResponsibleUser?: string | null
): string | null {
  const explicit = normalizeUserId(idResponsibleUser ?? entity.idResponsibleUser);
  if (explicit) return explicit;
  return normalizeUserId(entity.idUser);
}

export function getResponsibleDisplayLabel(
  effectiveId: string | null,
  creatorId: string | null,
  viewerUserId: string | null
): string {
  if (!effectiveId) return "—";
  if (viewerUserId && effectiveId === viewerUserId) return "Você";
  if (creatorId && effectiveId === creatorId && viewerUserId !== creatorId) return "Criador";
  if (creatorId && effectiveId === creatorId) return "Você";
  return "Outro utilizador";
}

export type ResponsibleChoice = "creator" | "self";

export function responsibleChoiceFromState(
  idResponsibleUser: string | null | undefined,
  viewerUserId: string | null
): ResponsibleChoice {
  if (!isExplicitResponsibleAssignment(idResponsibleUser)) return "creator";
  if (viewerUserId && normalizeUserId(idResponsibleUser) === viewerUserId) return "self";
  return "creator";
}

export function idResponsibleUserForChoice(
  choice: ResponsibleChoice,
  viewerUserId: string | null
): string | null {
  if (choice === "creator") return null;
  return viewerUserId;
}

async function enrichBatch<T extends { id: string | number } & ResponsibleEntity>(
  jwt: string,
  items: T[],
  concurrency: number
): Promise<T[]> {
  const out = items.slice();
  for (let i = 0; i < out.length; i += concurrency) {
    const chunk = out.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (item) => {
        const taskId = String(item.id);
        if (!isApiTaskUuid(taskId)) return;
        const r = await fetchTaskResponsible(jwt, taskId);
        if (r.kind === "ok") {
          const idx = out.findIndex((x) => String(x.id) === taskId);
          if (idx >= 0) out[idx] = { ...out[idx], idResponsibleUser: r.data.idResponsibleUser };
        }
      })
    );
  }
  return out;
}

export async function enrichTasksWithResponsible(
  jwt: string,
  tasks: Tarefa[],
  options?: { concurrency?: number }
): Promise<Tarefa[]> {
  const concurrency = options?.concurrency ?? 5;
  const apiTasks = tasks.filter((t) => !t.sharedTask && isApiTaskUuid(String(t.id)));
  if (apiTasks.length === 0) return tasks;

  const enriched = await enrichBatch(jwt, apiTasks, concurrency);
  const byId = new Map(enriched.map((t) => [String(t.id), t]));

  return tasks.map((t) => {
    const e = byId.get(String(t.id));
    return e ? { ...t, idResponsibleUser: e.idResponsibleUser } : t;
  });
}

export async function enrichSubtasksWithResponsible(
  jwt: string,
  subtasks: TarefaSubtarefa[],
  options?: { concurrency?: number }
): Promise<TarefaSubtarefa[]> {
  const concurrency = options?.concurrency ?? 5;
  const apiSubs = subtasks.filter((s) => isApiTaskUuid(s.id));
  if (apiSubs.length === 0) return subtasks;

  const enriched = await enrichBatch(jwt, apiSubs, concurrency);
  const byId = new Map(enriched.map((s) => [s.id, s]));

  return subtasks.map((s) => {
    const e = byId.get(s.id);
    return e ? { ...s, idResponsibleUser: e.idResponsibleUser } : s;
  });
}
