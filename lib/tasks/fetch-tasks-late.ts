import { API_BASE_URL } from "@/lib/constants";
import { normalizeTasksByDatePayload } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa } from "@/lib/types/models";

const TASKS_LATE_PATH = "/auth/api/tasks/late";

export type FetchTasksLateResult =
  | { kind: "ok"; tasks: Tarefa[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * GET `{API_BASE_URL}/auth/api/tasks/late` — tarefas atrasadas do usuário.
 * Header `Authorization: Bearer …`.
 */
export async function fetchTasksLate(jwtToken: string): Promise<FetchTasksLateResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${TASKS_LATE_PATH}`;

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

    // TODO (contract): 403 — sem permissão ou plano expirado.
    // TODO (contract): 404 — rota inexistente no ambiente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — lista vazia vs erro de contrato.
      // TODO (contract): paginação se a lista for grande.
      // TODO (contract): 200 com `null` ou objeto único — normalizar.
      return { kind: "ok", tasks: normalizeTasksByDatePayload(data) };
    }

    // TODO (contract): 400 / 422 — versão de API ou filtros inválidos.
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
