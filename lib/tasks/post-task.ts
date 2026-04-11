import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa } from "@/lib/types/models";

const TASKS_PATH = "/auth/api/tasks";

export type PostTaskPayload = {
  nameTask: string;
  descriptionTask: string;
  /** `YYYY-MM-DD` */
  dateTask: string;
  idObjective: number | string | null;
};

export type PostTaskResult =
  | { kind: "ok"; task: Tarefa }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number }
  | { kind: "invalid_response" };

/**
 * POST `{API_BASE_URL}/auth/api/tasks` — cria tarefa simples.
 * Header `Authorization: Bearer …`.
 */
export async function postTask(jwtToken: string, payload: PostTaskPayload): Promise<PostTaskResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${TASKS_PATH}`;

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
        idObjective: payload.idObjective,
      }),
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

    // TODO (contract): 403 — sem permissão ou plano.
    // TODO (contract): 404 — rota inexistente (versionamento).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 201 Created vs 200 — ambos tratados como sucesso.
      // TODO (contract): 204 No Content — definir se é sucesso sem corpo ou erro de contrato.
      const task = normalizeSingleTaskApiBody(data);
      if (!task) {
        // TODO (contract): corpo 200 com formato não documentado — mensagem ao usuário / retry.
        return { kind: "invalid_response" };
      }
      return { kind: "ok", task };
    }

    // TODO (contract): 400 / 422 — validação (campos obrigatórios, objetivo inexistente, data inválida).
    // TODO (contract): 409 — conflito (duplicidade, regra de negócio).
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
