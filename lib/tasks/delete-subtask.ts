import { API_BASE_URL } from "@/lib/constants";

const SUBTASK_PATH = "/auth/api/tasks/subtask";

export type DeleteSubtaskResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * DELETE `{API_BASE_URL}/auth/api/tasks/subtask/{idTask}` — exclui subtarefa.
 * Automaticamente atualiza `hasSubtasks` da tarefa pai no backend.
 */
export async function deleteSubtask(
  jwtToken: string,
  idTask: string
): Promise<DeleteSubtaskResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${SUBTASK_PATH}/${encodeURIComponent(idTask)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (res.status === 404) return { kind: "not_found" };

    if (res.ok) return { kind: "ok" };

    if (res.status >= 500) return { kind: "http_error", status: res.status };
    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
