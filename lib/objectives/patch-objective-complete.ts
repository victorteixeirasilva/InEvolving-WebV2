import { API_BASE_URL } from "@/lib/constants";

const OBJECTIVES_PATH = "/auth/api/objectives";

export type PatchObjectiveCompleteResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * PATCH `{API_BASE_URL}/auth/api/objectives/{objectiveId}/{completionDate}` — conclui o objetivo.
 * `completionDate` no formato `YYYY-MM-DD` (ex.: `new Date().toISOString().slice(0, 10)`).
 * Header `Authorization: Bearer …`.
 */
export async function patchObjectiveComplete(
  jwtToken: string,
  objectiveId: number | string,
  completionDate: string
): Promise<PatchObjectiveCompleteResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${OBJECTIVES_PATH}/${encodeURIComponent(String(objectiveId))}/${encodeURIComponent(completionDate)}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    try {
      await res.text();
    } catch {
      /* ignore */
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano não permite concluir.
    // TODO (contract): 404 — objetivo inexistente.
    // TODO (contract): 409 — objetivo já concluído ou regra de negócio (tratar como ok idempotente?).
    if (res.status === 403 || res.status === 404 || res.status === 409) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com corpo JSON do objetivo atualizado — hidratar cliente se necessário.
      // TODO (contract): 204 No Content — já tratado por `res.ok`.
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — data inválida ou objetivo em estado inválido; ler corpo.
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
