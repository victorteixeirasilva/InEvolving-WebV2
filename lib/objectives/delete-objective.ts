import { API_BASE_URL } from "@/lib/constants";

const OBJECTIVES_PATH = "/auth/api/objectives";

export type DeleteObjectiveResult =
  | { kind: "ok"; message?: string }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function parseDeleteBody(text: string): { message?: string } {
  const t = text.trim();
  if (!t) {
    // TODO (contract): 200/204 sem corpo — sucesso silencioso (comum em DELETE).
    return {};
  }
  try {
    const data = JSON.parse(t) as unknown;
    if (data !== null && typeof data === "object" && "message" in data) {
      const m = (data as { message?: unknown }).message;
      return { message: typeof m === "string" ? m : undefined };
    }
  } catch {
    // TODO (contract): corpo de sucesso não-JSON (text/plain).
  }
  return {};
}

/**
 * DELETE `{API_BASE_URL}/auth/api/objectives/{objectiveId}` — remove o objetivo.
 * Header `Authorization: Bearer …`.
 */
export async function deleteObjective(
  jwtToken: string,
  objectiveId: number | string
): Promise<DeleteObjectiveResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${OBJECTIVES_PATH}/${encodeURIComponent(String(objectiveId))}`;

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

    // TODO (contract): 403 — sem permissão ou plano não permite excluir.
    // TODO (contract): 404 — já removido ou id inexistente (idempotência: tratar como sucesso?).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 202 Accepted — exclusão assíncrona.
      // TODO (contract): 204 No Content — sem JSON; coberto por `parseDeleteBody` vazio.
      return { kind: "ok", message: body.message };
    }

    // TODO (contract): 409 — conflito (ex.: tarefas ativas que impedem delete, se a regra existir).
    // TODO (contract): 400 / 422 — validação de id.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry e mensagem ao usuário.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e mensagem no corpo (`error`, `errors`).
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
