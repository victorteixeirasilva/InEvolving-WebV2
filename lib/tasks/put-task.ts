import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa } from "@/lib/types/models";

const TASKS_PATH = "/auth/api/tasks";

export type PutTaskPayload = {
  nameTask: string;
  descriptionTask: string;
  idObjective: number | string | null;
};

export type PutTaskResult =
  | { kind: "ok"; task: Tarefa }
  /** 204, corpo vazio ou JSON que não mapeia para `Tarefa` — o chamador usa o formulário + tarefa anterior. */
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * PUT `{API_BASE_URL}/auth/api/tasks/{taskId}` — atualiza nome, descrição e objetivo.
 * Header `Authorization: Bearer …`.
 */
export async function putTask(
  jwtToken: string,
  taskId: number | string,
  payload: PutTaskPayload
): Promise<PutTaskResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASKS_PATH}/${encodeURIComponent(String(taskId))}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        nameTask: payload.nameTask,
        descriptionTask: payload.descriptionTask,
        idObjective: payload.idObjective,
      }),
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

    // TODO (contract): 400 / 422 — validação (objetivo inexistente, campos obrigatórios).
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
