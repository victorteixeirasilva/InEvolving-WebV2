import { API_BASE_URL } from "@/lib/constants";
import type { Category, Objective, ResponseDashboard } from "@/lib/types/models";

const DASHBOARD_CATEGORIES_PATH = "/auth/api/dashboard/categories";

export type FetchDashboardCategoriesResult =
  | { kind: "ok"; data: ResponseDashboard }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function normalizeCategoryItem(raw: unknown): Category | null {
  // TODO (contract): validar cada campo; `id` é UUID string na API.
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  let id: string | null = null;
  if (typeof o.id === "string" && o.id.trim()) id = o.id.trim();
  else if (typeof o.id === "number" && Number.isFinite(o.id)) id = String(o.id);
  if (!id) return null;
  const categoryName = typeof o.categoryName === "string" ? o.categoryName : "";
  const categoryDescription =
    typeof o.categoryDescription === "string" ? o.categoryDescription : "";
  const objectives = Array.isArray(o.objectives) ? (o.objectives as Objective[]) : [];
  return { id, categoryName, categoryDescription, objectives };
}

function normalizeDashboardCategoriesPayload(body: unknown): ResponseDashboard {
  // TODO (contract): validar formato de cada item de `categoryDTOList` (campos obrigatórios, tipos de `objectives`).
  if (body === null || typeof body !== "object") {
    // TODO (contract): corpo vazio ou array na raiz em vez de objeto — alinhar contrato com o back.
    return { idUser: 0, categoryDTOList: [] };
  }
  const o = body as Record<string, unknown>;
  const rawList = o.categoryDTOList;
  const categoryDTOList: Category[] = [];
  if (Array.isArray(rawList)) {
    for (const item of rawList) {
      const c = normalizeCategoryItem(item);
      if (c) categoryDTOList.push(c);
    }
  }
  const idUser =
    typeof o.idUser === "number" && Number.isFinite(o.idUser) ? o.idUser : 0;
  let urlVisionBord: string | null | undefined;
  if (o.urlVisionBord === null) urlVisionBord = null;
  else if (typeof o.urlVisionBord === "string") urlVisionBord = o.urlVisionBord;
  else urlVisionBord = undefined;
  const base: ResponseDashboard = { idUser, categoryDTOList };
  if (urlVisionBord !== undefined) {
    return { ...base, urlVisionBord };
  }
  return base;
}

/**
 * GET `{API_BASE_URL}/auth/api/dashboard/categories` — header `Authorization: Bearer …`.
 */
export async function fetchDashboardCategories(jwtToken: string): Promise<FetchDashboardCategoriesResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${DASHBOARD_CATEGORIES_PATH}`;

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
      // TODO (contract): resposta não-JSON (HTML de erro, vazio) — mensagem e fallback.
      data = {};
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — plano expirado, conta suspensa ou sem permissão para listar categorias.
    // TODO (contract): 404 — rota ou recurso inexistente (ambiente errado).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com `categoryDTOList` omitido vs `null` vs paginação (`content`, `items`); total count.
      // TODO (contract): 204 No Content — lista vazia explícita ou erro?
      // TODO (contract): 200 com corpo não objeto (ex.: string) — validar e falhar graciosamente.
      return { kind: "ok", data: normalizeDashboardCategoriesPayload(data) };
    }

    // TODO (contract): 400 / 422 — filtros ou versão de API inválidos.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — mensagem distinta e política de retry.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx (409, 410, etc.) se documentados.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS — diferenciar e expor retry.
    return { kind: "network_error" };
  }
}
