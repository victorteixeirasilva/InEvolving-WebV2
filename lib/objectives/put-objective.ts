import { API_BASE_URL } from "@/lib/constants";

const OBJECTIVES_PATH = "/auth/api/objectives";

export type PutObjectiveInput = {
  nameObjective: string;
  descriptionObjective: string;
};

export type PutObjectiveResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * PUT `{API_BASE_URL}/auth/api/objectives/{objectiveId}` — atualiza nome e descrição.
 * Header `Authorization: Bearer …`.
 */
export async function putObjective(
  jwtToken: string,
  objectiveId: number | string,
  input: PutObjectiveInput
): Promise<PutObjectiveResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${OBJECTIVES_PATH}/${encodeURIComponent(String(objectiveId))}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        nameObjective: input.nameObjective,
        descriptionObjective: input.descriptionObjective,
      }),
    });

    try {
      await res.text();
    } catch {
      /* ignore */
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão para editar este objetivo.
    // TODO (contract): 404 — objetivo inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com corpo JSON do objetivo — hidratar cliente se necessário.
      // TODO (contract): 204 No Content — já coberto por `res.ok`.
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — validação de campos; ler `message` / `errors`.
    // TODO (contract): 409 — conflito de versão (optimistic lock) se o back usar.
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
