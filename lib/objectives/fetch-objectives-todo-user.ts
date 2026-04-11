import { API_BASE_URL } from "@/lib/constants";
import type { Objective } from "@/lib/types/models";

const OBJECTIVES_TODO_USER_PATH = "/auth/api/objectives/status/todo/user";

export type FetchObjectivesTodoUserResult =
  | { kind: "ok"; objectives: Objective[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function normalizeTodoObjectiveItem(raw: unknown): Objective | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  let id: number | string | null = null;
  if (typeof o.id === "string" && o.id.trim()) id = o.id.trim();
  else if (typeof o.id === "number" && Number.isFinite(o.id)) id = o.id;
  if (id === null) return null;

  const nameObjective = typeof o.nameObjective === "string" ? o.nameObjective : "";
  const descriptionObjective =
    typeof o.descriptionObjective === "string" ? o.descriptionObjective : "";

  const rawStatus = typeof o.statusObjective === "string" ? o.statusObjective.trim() : "";
  // API usa `TODO` para em andamento; o app normaliza para `IN_PROGRESS`.
  const statusObjective: Objective["statusObjective"] =
    rawStatus === "DONE" ? "DONE" : "IN_PROGRESS";

  let completionDate: string | null | undefined;
  if (o.completionDate === null) completionDate = null;
  else if (typeof o.completionDate === "string") completionDate = o.completionDate;
  else completionDate = undefined;

  let idUser: number | string | undefined;
  if (typeof o.idUser === "string" && o.idUser.trim()) idUser = o.idUser.trim();
  else if (typeof o.idUser === "number" && Number.isFinite(o.idUser)) idUser = o.idUser;

  return {
    id,
    nameObjective,
    descriptionObjective,
    statusObjective,
    completionDate: completionDate ?? undefined,
    idUser,
  };
}

function normalizeTodoObjectivesPayload(body: unknown): Objective[] {
  const out: Objective[] = [];
  const pushItems = (arr: unknown[]) => {
    for (const item of arr) {
      const obj = normalizeTodoObjectiveItem(item);
      if (obj) out.push(obj);
    }
  };

  if (Array.isArray(body)) {
    pushItems(body);
    return out;
  }
  if (body !== null && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["data", "objectives", "content", "items"] as const) {
      const v = o[key];
      if (Array.isArray(v)) {
        // TODO (contract): confirmar wrapper do back; remover fallbacks quando o contrato for fixo.
        pushItems(v);
        return out;
      }
    }
  }
  // TODO (contract): corpo vazio, objeto sem lista ou paginação (`page`, `totalElements`) — mapear aqui.
  return out;
}

/**
 * GET `{API_BASE_URL}/auth/api/objectives/status/todo/user` — objetivos em andamento (`TODO` na API).
 * Header `Authorization: Bearer …`.
 */
export async function fetchObjectivesTodoUser(jwtToken: string): Promise<FetchObjectivesTodoUserResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${OBJECTIVES_TODO_USER_PATH}`;

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
      // TODO (contract): resposta não-JSON ou vazia em sucesso/erro.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — plano expirado ou sem permissão para listar objetivos.
    // TODO (contract): 404 — rota inexistente (ambiente/versionamento).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — tratar como lista vazia ou erro de contrato.
      // TODO (contract): paginação se a lista for grande (cursor/page).
      // TODO (contract): 200 com array vazio vs `null` — já normalizado para [].
      return { kind: "ok", objectives: normalizeTodoObjectivesPayload(data) };
    }

    // TODO (contract): 400 / 422 — filtros ou versão de API.
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
