import { API_BASE_URL } from "@/lib/constants";
import type { Objective } from "@/lib/types/models";

const USER_OBJECTIVES_PATH = "/auth/api/objectives/user";

export type FetchUserObjectivesResult =
  | { kind: "ok"; objectives: Objective[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

export function normalizeUserObjectiveItem(raw: unknown): Objective | null {
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
  // API pode usar `TODO` para em andamento; apenas `DONE` fecha como concluído.
  const statusObjective: Objective["statusObjective"] =
    rawStatus === "DONE" ? "DONE" : "IN_PROGRESS";

  let completionDate: string | null | undefined;
  if (o.completionDate === null) completionDate = null;
  else if (typeof o.completionDate === "string") completionDate = o.completionDate;
  else completionDate = undefined;

  let idUser: number | string | undefined;
  if (typeof o.idUser === "string" && o.idUser.trim()) idUser = o.idUser.trim();
  else if (typeof o.idUser === "number" && Number.isFinite(o.idUser)) idUser = o.idUser;

  const base: Objective = {
    id,
    nameObjective,
    descriptionObjective,
    statusObjective,
    completionDate: completionDate ?? undefined,
    idUser,
  };

  const tot = o.totNumberTasks;
  if (typeof tot === "number" && Number.isFinite(tot)) {
    base.totNumberTasks = tot;
    if (typeof o.numberTasksToDo === "number") base.numberTasksToDo = o.numberTasksToDo;
    if (typeof o.numberTasksDone === "number") base.numberTasksDone = o.numberTasksDone;
    if (typeof o.numberTasksInProgress === "number") base.numberTasksInProgress = o.numberTasksInProgress;
    if (typeof o.numberTasksOverdue === "number") base.numberTasksOverdue = o.numberTasksOverdue;
    if (typeof o.numberTasksCancelled === "number") base.numberTasksCancelled = o.numberTasksCancelled;
  }

  return base;
}

function normalizeUserObjectivesPayload(body: unknown): Objective[] {
  const out: Objective[] = [];
  const pushItems = (arr: unknown[]) => {
    for (const item of arr) {
      const obj = normalizeUserObjectiveItem(item);
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
        // TODO (contract): confirmar qual chave o back usa; remover fallbacks quando o contrato for fixo.
        pushItems(v);
        return out;
      }
    }
  }
  // TODO (contract): corpo vazio, objeto sem lista ou formato paginado (`page`, `totalElements`) — mapear aqui.
  return out;
}

/**
 * GET `{API_BASE_URL}/auth/api/objectives/user` — lista todos os objetivos do usuário autenticado.
 */
export async function fetchUserObjectives(jwtToken: string): Promise<FetchUserObjectivesResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${USER_OBJECTIVES_PATH}`;

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
      // TODO (contract): 200 com `null` / objeto único em vez de array — normalizar aqui.
      return { kind: "ok", objectives: normalizeUserObjectivesPayload(data) };
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
