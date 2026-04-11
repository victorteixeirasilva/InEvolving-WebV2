import { API_BASE_URL } from "@/lib/constants";

const TASKS_REPEAT_PREFIX = "/auth/api/tasks/repeat";

export type DeleteTaskRepeatResult =
  | { kind: "ok"; message?: string }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function parseDeleteBody(text: string): { message?: string } {
  const t = text.trim();
  if (!t) {
    // TODO (contract): 200/204 sem corpo — sucesso silencioso.
    return {};
  }
  try {
    const data = JSON.parse(t) as unknown;
    if (data !== null && typeof data === "object" && "message" in data) {
      const m = (data as { message?: unknown }).message;
      return { message: typeof m === "string" ? m : undefined };
    }
  } catch {
    // TODO (contract): corpo não-JSON.
  }
  return {};
}

/**
 * DELETE `{API_BASE_URL}/auth/api/tasks/repeat/{taskId}/{dateTask}` — remove a série recorrente e repetições.
 * `dateTask` em `YYYY-MM-DD`. Header `Authorization: Bearer …`.
 */
export async function deleteTaskRepeat(
  jwtToken: string,
  taskId: number | string,
  dateTask: string
): Promise<DeleteTaskRepeatResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASKS_REPEAT_PREFIX}/${encodeURIComponent(String(taskId))}/${encodeURIComponent(dateTask)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const text = await res.text();
    const body = parseDeleteBody(text);

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão na tarefa ou plano.
    // TODO (contract): 404 — série/data não encontrada (idempotência?).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 202 Accepted — exclusão assíncrona.
      // TODO (contract): 204 No Content.
      return { kind: "ok", message: body.message };
    }

    // TODO (contract): 409 — conflito (ex.: tarefa não recorrente).
    // TODO (contract): 400 / 422 — data ou id inválidos.
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
