import { API_BASE_URL } from "@/lib/constants";
import { normalizeTaskDateField } from "@/lib/tasks/format-task-date-local";
import type { Tarefa, TarefaStatus } from "@/lib/types/models";

const TASKS_PATH = "/auth/api/tasks";

export type FetchTasksByDateResult =
  | { kind: "ok"; tasks: Tarefa[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function mapApiStatus(raw: string): TarefaStatus {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "_");
  switch (u) {
    case "TODO":
    case "PENDING":
      return "PENDING";
    case "IN_PROGRESS":
    case "INPROGRESS":
    case "DOING":
      return "IN_PROGRESS";
    case "DONE":
    case "COMPLETED":
    case "CONCLUIDA":
    case "CONCLUÍDA":
      return "DONE";
    case "OVERDUE":
    case "LATE":
    case "ATRASADA":
      return "OVERDUE";
    case "CANCELLED":
    case "CANCELED":
    case "CANCELADA":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

function normalizeApiTaskRow(raw: unknown): Tarefa | null {
  if (raw === null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  let idStr: string | null = null;
  if (typeof o.id === "string" && o.id.trim()) idStr = o.id.trim();
  else if (typeof o.id === "number" && Number.isFinite(o.id)) idStr = String(o.id);
  if (!idStr) return null;

  const nameTask = typeof o.nameTask === "string" ? o.nameTask : "";
  const descriptionTask = typeof o.descriptionTask === "string" ? o.descriptionTask : "";
  const status = mapApiStatus(typeof o.status === "string" ? o.status : "");
  const dateTask = normalizeTaskDateField(o.dateTask);

  let idObjective: number | string = 0;
  if (typeof o.idObjective === "string" && o.idObjective.trim()) idObjective = o.idObjective.trim();
  else if (typeof o.idObjective === "number" && Number.isFinite(o.idObjective)) idObjective = o.idObjective;

  let idUser: number | string | undefined;
  if (typeof o.idUser === "string" && o.idUser.trim()) idUser = o.idUser.trim();
  else if (typeof o.idUser === "number" && Number.isFinite(o.idUser)) idUser = o.idUser;

  let idParentTask: string | null | undefined;
  if (o.idParentTask === null || o.idParentTask === undefined) idParentTask = o.idParentTask as null | undefined;
  else if (typeof o.idParentTask === "string") idParentTask = o.idParentTask.trim() || null;
  else idParentTask = String(o.idParentTask);

  let hasSubtasks: boolean | null | undefined;
  if (o.hasSubtasks === null) hasSubtasks = null;
  else if (typeof o.hasSubtasks === "boolean") hasSubtasks = o.hasSubtasks;

  let blockedByObjective: boolean | null | undefined;
  if (o.blockedByObjective === null) blockedByObjective = null;
  else if (typeof o.blockedByObjective === "boolean") blockedByObjective = o.blockedByObjective;

  const cancellationReason =
    typeof o.cancellationReason === "string" ? o.cancellationReason : undefined;

  const isCopy = typeof o.isCopy === "boolean" ? o.isCopy : false;

  const rawOriginal =
    o.idOriginalTask !== undefined ? o.idOriginalTask : (o as Record<string, unknown>).id_original_task;
  let idOriginalTask: string | number | null | undefined;
  if (rawOriginal === null) {
    idOriginalTask = null;
  } else if (typeof rawOriginal === "string") {
    const t = rawOriginal.trim();
    idOriginalTask = t.length > 0 ? t : null;
  } else if (typeof rawOriginal === "number" && Number.isFinite(rawOriginal)) {
    idOriginalTask = rawOriginal;
  } else {
    idOriginalTask = undefined;
  }

  return {
    id: idStr,
    uuid: idStr,
    nameTask,
    descriptionTask,
    status,
    dateTask,
    idObjective,
    idUser,
    idParentTask: idParentTask ?? null,
    hasSubtasks: hasSubtasks ?? null,
    blockedByObjective: blockedByObjective ?? null,
    cancellationReason,
    isCopy,
    idOriginalTask,
  };
}

/** Objeto único ou wrapper (`data`, `task`, …) — usado em `GET /auth/api/tasks/task/{id}`. */
export function normalizeSingleTaskApiBody(body: unknown): Tarefa | null {
  const direct = normalizeApiTaskRow(body);
  if (direct) return direct;
  if (body !== null && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["data", "task", "content", "item"] as const) {
      const v = o[key];
      const t = normalizeApiTaskRow(v);
      if (t) return t;
    }
  }
  // TODO (contract): array de um elemento na raiz — normalizar se o back enviar assim.
  return null;
}

/** Normaliza array de tarefas (array direto ou wrapper `data` / `tasks` / …) — mesmo formato em GET por data ou por objetivo. */
export function normalizeTasksByDatePayload(body: unknown): Tarefa[] {
  const out: Tarefa[] = [];
  const push = (arr: unknown[]) => {
    for (const item of arr) {
      const t = normalizeApiTaskRow(item);
      if (t) out.push(t);
    }
  };

  if (Array.isArray(body)) {
    push(body);
    return out;
  }
  if (body !== null && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["data", "tasks", "content", "items"] as const) {
      const v = o[key];
      if (Array.isArray(v)) {
        // TODO (contract): confirmar wrapper do back; remover fallbacks quando o contrato for fixo.
        push(v);
        return out;
      }
    }
  }
  // TODO (contract): corpo vazio, objeto sem lista ou paginação — mapear aqui.
  return out;
}

/**
 * GET `{API_BASE_URL}/auth/api/tasks/{date}` — `date` em `YYYY-MM-DD` (ex.: `formatDateEnCA(new Date())`).
 * Header `Authorization: Bearer …`.
 */
export async function fetchTasksByDate(
  jwtToken: string,
  date: string
): Promise<FetchTasksByDateResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${TASKS_PATH}/${encodeURIComponent(date)}`;

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

    // TODO (contract): 403 — sem permissão para listar tarefas nesta data.
    // TODO (contract): 404 — rota ou data inválida no ambiente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — lista vazia vs erro de contrato.
      // TODO (contract): paginação se a lista for grande.
      // TODO (contract): 200 com `null` vs objeto único — normalizar.
      return { kind: "ok", tasks: normalizeTasksByDatePayload(data) };
    }

    // TODO (contract): 400 / 422 — formato de data ou versão de API.
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
