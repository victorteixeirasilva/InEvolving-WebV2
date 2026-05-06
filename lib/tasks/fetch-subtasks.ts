import { API_BASE_URL } from "@/lib/constants";
import { normalizeApiSubtask } from "@/lib/subtarefas";
import type { TarefaSubtarefa } from "@/lib/types/models";

const SUBTASK_PATH = "/auth/api/tasks/subtask";

export type FetchSubtasksResult =
  | { kind: "ok"; subtasks: TarefaSubtarefa[] }
  | { kind: "unauthorized" }
  | { kind: "not_found" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * GET `{API_BASE_URL}/auth/api/tasks/subtask/{idParentTask}` — lista subtarefas de uma tarefa pai.
 * Retorna array vazio quando não há subtarefas (nunca 404 para lista vazia).
 */
export async function fetchSubtasks(
  jwtToken: string,
  idParentTask: string
): Promise<FetchSubtasksResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${SUBTASK_PATH}/${encodeURIComponent(idParentTask)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 404) return { kind: "not_found" };
    if (res.status === 403) return { kind: "http_error", status: 403 };

    if (res.ok) {
      const list = Array.isArray(data) ? data : [];
      const subtasks: TarefaSubtarefa[] = [];
      for (const item of list) {
        const s = normalizeApiSubtask(item);
        if (s) subtasks.push(s);
      }
      return { kind: "ok", subtasks };
    }

    if (res.status >= 500) return { kind: "http_error", status: res.status };
    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
