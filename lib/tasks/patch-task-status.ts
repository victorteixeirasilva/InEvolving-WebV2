import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa, TarefaStatus } from "@/lib/types/models";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

export type PatchTaskStatusResult =
  | { kind: "ok"; task?: Tarefa }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number }
  /** Corpo de cancelamento vazio após normalização. */
  | { kind: "invalid_cancellation" };

/** Motivos separados por `;`, sem espaços extras à esquerda/direita de cada segmento. */
export function normalizeCancellationReasonForApi(raw: string): string {
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(";");
}

function parseSuccess(res: Response, data: unknown): PatchTaskStatusResult {
  if (res.status === 204 || data === null) {
    // TODO (contract): 200 com corpo vazio vs 204 — documentar.
    return { kind: "ok_no_body" };
  }
  const task = normalizeSingleTaskApiBody(data);
  if (task) return { kind: "ok", task };
  // TODO (contract): 200 com JSON que não mapeia para `Tarefa` — erro ou ok sem corpo?
  return { kind: "ok_no_body" };
}

async function patchNoBody(url: string, jwtToken: string): Promise<PatchTaskStatusResult> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown = null;
    try {
      const text = await res.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      // TODO (contract): resposta não-JSON em sucesso/erro.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano.
    // TODO (contract): 404 — tarefa inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      return parseSuccess(res, data);
    }

    // TODO (contract): 400 / 422 — validação (transição de status inválida).
    // TODO (contract): 409 — conflito de estado.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}

async function patchCanceled(
  jwtToken: string,
  idTask: number | string,
  cancellationReason: string
): Promise<PatchTaskStatusResult> {
  const cleaned = normalizeCancellationReasonForApi(cancellationReason);
  if (!cleaned) {
    return { kind: "invalid_cancellation" };
  }

  const url = `${API_BASE}/auth/api/tasks/status/canceled`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        idTask,
        cancellationReason: cleaned,
      }),
    });

    let data: unknown = null;
    try {
      const text = await res.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão.
    // TODO (contract): 404 — tarefa inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      return parseSuccess(res, data);
    }

    // TODO (contract): 400 / 422 — motivos obrigatórios ou formato inválido.
    // TODO (contract): 409 — tarefa já cancelada ou regra de negócio.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e mensagem no corpo.
    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}

/**
 * Atualiza o status da tarefa no back conforme o `TarefaStatus` do app.
 * Cancelamento: `cancellationReason` com motivos separados por `;`.
 */
export async function patchTaskStatus(
  jwtToken: string,
  taskId: number | string,
  status: TarefaStatus,
  cancellationReason?: string
): Promise<PatchTaskStatusResult> {
  const id = encodeURIComponent(String(taskId));

  switch (status) {
    case "PENDING":
      return patchNoBody(`${API_BASE}/auth/api/tasks/status/todo/${id}`, jwtToken);
    case "IN_PROGRESS":
      return patchNoBody(`${API_BASE}/auth/api/tasks/status/progress/${id}`, jwtToken);
    case "DONE":
      return patchNoBody(`${API_BASE}/auth/api/tasks/status/done/${id}`, jwtToken);
    case "OVERDUE":
      return patchNoBody(`${API_BASE}/auth/api/tasks/status/late/${id}`, jwtToken);
    case "CANCELLED":
      return patchCanceled(jwtToken, taskId, cancellationReason ?? "");
    default:
      return { kind: "http_error", status: 400 };
  }
}
