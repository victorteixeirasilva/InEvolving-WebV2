import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa } from "@/lib/types/models";

const TASK_BY_ID_PREFIX = "/auth/api/tasks/task";

export type FetchTaskByIdResult =
  | { kind: "ok"; task: Tarefa }
  | { kind: "unauthorized" }
  | { kind: "not_found" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number }
  | { kind: "invalid_body" };

/**
 * GET `{API_BASE_URL}/auth/api/tasks/task/{id}` — detalhe de uma tarefa.
 * Header `Authorization: Bearer …`.
 */
export async function fetchTaskById(
  jwtToken: string,
  taskId: number | string
): Promise<FetchTaskByIdResult> {
  const id = String(taskId).trim();
  if (!id) {
    return { kind: "not_found" };
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASK_BY_ID_PREFIX}/${encodeURIComponent(id)}`;

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

    // TODO (contract): 403 — sem permissão para ver esta tarefa.
    if (res.status === 404) {
      return { kind: "not_found" };
    }

    // TODO (contract): 403 explícito (sem permissão) vs 404 (ocultar existência) — distinguir se o back documentar.
    if (res.status === 403) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — tratar como não encontrada ou erro de contrato.
      const task = normalizeSingleTaskApiBody(data);
      if (!task) {
        // TODO (contract): 200 com corpo inesperado — log estruturado e mensagem ao usuário.
        return { kind: "invalid_body" };
      }
      return { kind: "ok", task };
    }

    // TODO (contract): 400 / 422 — id malformado.
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
