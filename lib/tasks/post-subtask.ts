import { API_BASE_URL } from "@/lib/constants";
import { normalizeApiSubtask } from "@/lib/subtarefas";
import type { TarefaSubtarefa } from "@/lib/types/models";

const SUBTASK_PATH = "/auth/api/tasks/subtask";

export type PostSubtaskPayload = {
  nameTask: string;
  descriptionTask: string;
  /** `YYYY-MM-DD` */
  dateTask: string;
  idParentTask: string;
};

export type PostSubtaskResult =
  | { kind: "ok"; subtask: TarefaSubtarefa }
  | { kind: "unauthorized" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number }
  | { kind: "invalid_response" };

/**
 * POST `{API_BASE_URL}/auth/api/tasks/subtask` — cria subtarefa vinculada à tarefa pai.
 * `idUser` é extraído do JWT pelo gateway.
 */
export async function postSubtask(
  jwtToken: string,
  payload: PostSubtaskPayload
): Promise<PostSubtaskResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${SUBTASK_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        nameTask: payload.nameTask,
        descriptionTask: payload.descriptionTask,
        dateTask: payload.dateTask,
        idParentTask: payload.idParentTask,
      }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 403) return { kind: "forbidden" };
    if (res.status === 404) return { kind: "not_found" };

    if (res.ok) {
      const subtask = normalizeApiSubtask(data);
      if (!subtask) return { kind: "invalid_response" };
      return { kind: "ok", subtask };
    }

    if (res.status >= 500) return { kind: "http_error", status: res.status };
    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
