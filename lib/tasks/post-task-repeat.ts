import { API_BASE_URL } from "@/lib/constants";
import { normalizeSingleTaskApiBody } from "@/lib/tasks/fetch-tasks-by-date";
import type { Tarefa } from "@/lib/types/models";

const TASKS_REPEAT_PREFIX = "/auth/api/tasks/repeat";

/** 0=Dom … 6=Sáb — mesmo índice que `Date.getDay()` e o formulário de nova tarefa. */
export type WeekdaySelection = {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
};

export function recurringDaysToWeekdayFlags(days: number[]): WeekdaySelection {
  const set = new Set(days);
  return {
    monday: set.has(1),
    tuesday: set.has(2),
    wednesday: set.has(3),
    thursday: set.has(4),
    friday: set.has(5),
    saturday: set.has(6),
    sunday: set.has(0),
  };
}

export type PostTaskRepeatResult =
  | { kind: "ok"; task?: Tarefa }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * POST `{API_BASE_URL}/auth/api/tasks/repeat/{taskId}/{dateTask}/{endDate}` — torna a tarefa recorrente.
 * `dateTask` e `endDate` em `YYYY-MM-DD`. Header `Authorization: Bearer …`.
 */
export async function postTaskRepeat(
  jwtToken: string,
  taskId: number | string,
  dateTask: string,
  endDate: string,
  weekdays: WeekdaySelection
): Promise<PostTaskRepeatResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const idSeg = encodeURIComponent(String(taskId));
  const dateSeg = encodeURIComponent(dateTask);
  const endSeg = encodeURIComponent(endDate);
  const url = `${base}${TASKS_REPEAT_PREFIX}/${idSeg}/${dateSeg}/${endSeg}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(weekdays),
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

    // TODO (contract): 403 — sem permissão na tarefa ou plano.
    // TODO (contract): 404 — tarefa/data não encontrada ou rota inválida.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content — sucesso sem corpo (tratar como ok sem `task`).
      // TODO (contract): 201 vs 200 — documentar corpo (tarefa atualizada vs lista de instâncias).
      const task = data !== null && data !== undefined ? normalizeSingleTaskApiBody(data) : null;
      return { kind: "ok", task: task ?? undefined };
    }

    // TODO (contract): 400 / 422 — dias inválidos, data final antes da inicial, tarefa já recorrente.
    // TODO (contract): 409 — conflito de regra de negócio.
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
