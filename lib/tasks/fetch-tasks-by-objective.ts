import { API_BASE_URL } from "@/lib/constants";
import { normalizeTasksByDatePayload } from "@/lib/tasks/fetch-tasks-by-date";
import type { Objective, Tarefa } from "@/lib/types/models";

const TASKS_BY_OBJECTIVE_PREFIX = "/auth/api/tasks/objective";

export type FetchTasksByObjectiveResult =
  | { kind: "ok"; tasks: Tarefa[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * Conta só tarefas raiz (`idParentTask` null) para não duplicar com subtarefas quando a API as lista à parte.
 */
function rootTasksOnly(tasks: Tarefa[]): Tarefa[] {
  return tasks.filter((t) => t.idParentTask == null || t.idParentTask === "");
}

/**
 * Agrega contagens a partir do `status` normalizado da UI para os campos usados na lista de objetivos.
 */
export function aggregateTaskCountsForObjective(tasks: Tarefa[]): Pick<
  Objective,
  | "totNumberTasks"
  | "numberTasksToDo"
  | "numberTasksDone"
  | "numberTasksInProgress"
  | "numberTasksOverdue"
  | "numberTasksCancelled"
> {
  const roots = rootTasksOnly(tasks);
  const tot = roots.length;
  let numberTasksDone = 0;
  let numberTasksToDo = 0;
  let numberTasksInProgress = 0;
  let numberTasksOverdue = 0;
  let numberTasksCancelled = 0;

  for (const t of roots) {
    switch (t.status) {
      case "DONE":
        numberTasksDone += 1;
        break;
      case "CANCELLED":
        numberTasksCancelled += 1;
        break;
      case "IN_PROGRESS":
        numberTasksInProgress += 1;
        break;
      case "OVERDUE":
        numberTasksOverdue += 1;
        break;
      default:
        numberTasksToDo += 1;
    }
  }

  return {
    totNumberTasks: tot,
    numberTasksToDo,
    numberTasksDone,
    numberTasksInProgress,
    numberTasksOverdue,
    numberTasksCancelled,
  };
}

/**
 * GET `{API_BASE_URL}/auth/api/tasks/objective/{objectiveId}` — lista tarefas do objetivo.
 * Header `Authorization: Bearer …`.
 *
 * TODO (backend): endpoint em lote para N objetivos (evitar N requisições na lista de objetivos).
 */
export async function fetchTasksByObjective(
  jwtToken: string,
  objectiveId: number | string
): Promise<FetchTasksByObjectiveResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASKS_BY_OBJECTIVE_PREFIX}/${encodeURIComponent(String(objectiveId))}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // TODO (contract): resposta não-JSON ou vazia em sucesso/erro.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão neste objetivo.
    // TODO (contract): 404 — objetivo inexistente (tratar como lista vazia ou erro explícito).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — lista vazia vs erro de contrato.
      // TODO (contract): paginação (cursor/page) se a lista for grande.
      // TODO (contract): 200 com `null` vs objeto único — normalizar.
      return { kind: "ok", tasks: normalizeTasksByDatePayload(data) };
    }

    // TODO (contract): 400 / 422 — id de objetivo inválido.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry e mensagem ao usuário.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
