import { API_BASE_URL } from "@/lib/constants";
import type { Category, Objective } from "@/lib/types/models";

const CATEGORY_OBJECTIVES_PATH = "/auth/api/dashboard/category/objectives";

export type FetchCategoryObjectivesResult =
  | { kind: "ok"; category: Category }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * Mescla o JSON da API com a categoria já conhecida no cliente (ex.: campos de compartilhamento).
 * TODO (contract): se o back devolver sempre o DTO completo de `Category`, simplificar para só validar/parsear.
 */
export function mergeCategoryObjectivesResponse(propCategory: Category, body: unknown): Category {
  // TODO (contract): raiz = array de `Objective` em vez de objeto categoria — mapear para `propCategory` + objectives.
  if (body === null || typeof body !== "object") {
    // TODO (contract): corpo vazio em 200 — tratar como lista vazia ou erro de contrato.
    return propCategory;
  }
  const o = body as Record<string, unknown>;
  const next: Category = { ...propCategory };
  if (typeof o.id === "string" && o.id.trim()) next.id = o.id.trim();
  else if (typeof o.id === "number" && Number.isFinite(o.id)) next.id = String(o.id);
  if (typeof o.categoryName === "string") next.categoryName = o.categoryName;
  if (typeof o.categoryDescription === "string") next.categoryDescription = o.categoryDescription;
  if (Array.isArray(o.objectives)) {
    // TODO (contract): validar cada objetivo (campos obrigatórios, enums de status).
    next.objectives = o.objectives as Objective[];
  }
  // TODO (contract): nomes em snake_case / wrapper `{ data: Category }` — normalizar aqui.
  return next;
}

/**
 * GET `{API_BASE_URL}/auth/api/dashboard/category/objectives/{categoryId}` — `Authorization: Bearer …`.
 */
export async function fetchCategoryObjectives(
  propCategory: Category,
  jwtToken: string
): Promise<FetchCategoryObjectivesResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${CATEGORY_OBJECTIVES_PATH}/${encodeURIComponent(propCategory.id)}`;

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
      // TODO (contract): resposta não-JSON (HTML, vazio) em sucesso ou erro.
      data = {};
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão nesta categoria ou plano expirado.
    // TODO (contract): 404 — categoria inexistente ou id inválido.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — lista vazia ou erro semântico.
      // TODO (contract): paginação de objetivos (`content`, `totalPages`) se aplicável.
      return { kind: "ok", category: mergeCategoryObjectivesResponse(propCategory, data) };
    }

    // TODO (contract): 400 / 422 — id malformado ou versão de API.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — mensagem e retry.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS — diferenciar.
    return { kind: "network_error" };
  }
}
