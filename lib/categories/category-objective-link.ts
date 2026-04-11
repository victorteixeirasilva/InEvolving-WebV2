import { API_BASE_URL } from "@/lib/constants";

const CATEGORY_OBJECTIVE_PATH = "/auth/api/categories/objective";

export type LinkCategoryObjectiveResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * POST `{API_BASE_URL}/auth/api/categories/objective` — associa objetivo à categoria.
 */
export async function postCategoryObjective(
  jwtToken: string,
  idCategory: string,
  idObjective: number | string
): Promise<LinkCategoryObjectiveResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${CATEGORY_OBJECTIVE_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ idCategory, idObjective }),
    });

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão na categoria ou no objetivo.
    // TODO (contract): 404 — categoria ou objetivo inexistente.
    // TODO (contract): 409 — vínculo já existe (idempotência: tratar como ok?).
    if (res.status === 403 || res.status === 404 || res.status === 409) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com DTO atualizado; 201 Created; 204 No Content.
      try {
        await res.text();
      } catch {
        /* ignore */
      }
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — validação de ids; ler mensagem do corpo.
    // TODO (contract): 429 — rate limit.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e payload de erro padronizado.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}

/**
 * DELETE `{API_BASE_URL}/auth/api/categories/objective/{idCategory}/{idObjective}`.
 * Envia também o corpo JSON conforme contrato legado (alguns gateways ignoram body em DELETE).
 */
export async function deleteCategoryObjective(
  jwtToken: string,
  idCategory: string,
  idObjective: number | string
): Promise<LinkCategoryObjectiveResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${CATEGORY_OBJECTIVE_PATH}/${encodeURIComponent(idCategory)}/${encodeURIComponent(String(idObjective))}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ idCategory, idObjective }),
    });

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão.
    // TODO (contract): 404 — vínculo ou recurso inexistente (idempotência: tratar como ok?).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com corpo; 204 No Content.
      try {
        await res.text();
      } catch {
        /* ignore */
      }
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422; 409 — regra de negócio ao remover.
    // TODO (contract): 429.
    if (res.status >= 500) {
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
