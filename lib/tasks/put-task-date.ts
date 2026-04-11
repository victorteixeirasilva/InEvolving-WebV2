import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import { toDateInputValue } from "@/lib/tasks/format-task-date-local";
import type { Tarefa } from "@/lib/types/models";

const TASKS_DATE_PATH = "/auth/api/tasks/date";

export type PutTaskDateResult =
  | { kind: "ok"; task: Tarefa }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * `YYYY-MM-DD` para o segmento de URL (evita `toISOString().split("T")[0]`, que usa UTC e pode mudar o dia).
 */
export function taskFormDateToApiPathSegment(dateTask: string): string | null {
  const ymd = toDateInputValue(dateTask);
  return ymd || null;
}

/**
 * PUT `{API_BASE_URL}/auth/api/tasks/date/{taskId}/{yyyy-MM-dd}` — altera a data da tarefa.
 * Header `Authorization: Bearer …`.
 */
export async function putTaskDate(
  jwtToken: string,
  taskId: number | string,
  dateTask: string
): Promise<PutTaskDateResult> {
  const ymd = taskFormDateToApiPathSegment(dateTask);
  if (!ymd) {
    // TODO (contract): data inválida no cliente — o back deve documentar 400/422 para data fora do contrato.
    return { kind: "http_error", status: 400 };
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASKS_DATE_PATH}/${encodeURIComponent(String(taskId))}/${encodeURIComponent(ymd)}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
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
      // TODO (contract): resposta não-JSON ou vazia em sucesso/erro.
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
      if (res.status === 204 || data === null) {
        // TODO (contract): 200 com corpo vazio — hoje tratado como `ok_no_body`.
        return { kind: "ok_no_body" };
      }
      // TODO (contract): 200 com corpo parcial vs tarefa completa — documentar.
      const task = normalizeSingleTaskApiBody(data);
      if (task) return { kind: "ok", task };
      // TODO (contract): corpo 200 com formato não documentado — exigir contrato ou erro explícito.
      return { kind: "ok_no_body" };
    }

    // TODO (contract): 400 / 422 — validação (data inválida, regra de recorrência).
    // TODO (contract): 409 — conflito de versão ou regra de negócio.
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
