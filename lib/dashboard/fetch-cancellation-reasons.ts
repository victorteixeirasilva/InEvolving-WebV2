import { API_BASE_URL } from "@/lib/constants";

const CANCELLATION_REASON_PATH = "/auth/api/dashboard/cancellation-reason";

export type CancellationReasonItem = {
  reason: string;
  count: number;
};

export type FetchCancellationReasonsResult =
  | { kind: "ok"; reasons: CancellationReasonItem[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * Normaliza resposta da API para `{ reason, count }[]`.
 */
export function normalizeCancellationReasonsPayload(body: unknown): CancellationReasonItem[] {
  if (Array.isArray(body)) {
    // TODO (contract): validar cada item; nomes alternativos (`label`, `motivo`, `description`).
    const out: CancellationReasonItem[] = [];
    for (const item of body) {
      if (item === null || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const reasonRaw =
        typeof o.reason === "string"
          ? o.reason
          : typeof o.name === "string"
            ? o.name
            : typeof o.motivo === "string"
              ? o.motivo
              : "";
      const reason = reasonRaw.trim();
      if (!reason) continue;
      const count =
        typeof o.count === "number" && Number.isFinite(o.count)
          ? o.count
          : typeof o.amount === "number" && Number.isFinite(o.amount)
            ? o.amount
            : typeof o.total === "number" && Number.isFinite(o.total)
              ? o.total
              : typeof o.quantity === "number" && Number.isFinite(o.quantity)
                ? o.quantity
                : 0;
      out.push({ reason, count: Math.max(0, Math.floor(count)) });
    }
    return out;
  }
  if (body !== null && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["reasonList", "data", "reasons", "items", "content"] as const) {
      const v = o[key];
      if (Array.isArray(v)) return normalizeCancellationReasonsPayload(v);
    }
    // TODO (contract): mapa `Record<string, number>` na raiz — converter para array.
  }
  // TODO (contract): corpo vazio em 200 — lista vazia ou erro de contrato.
  return [];
}

/**
 * GET `{API_BASE_URL}/auth/api/dashboard/cancellation-reason/{idObjective}?idObjective=…`
 * (query espelha o path conforme contrato legado do back).
 */
export async function fetchCancellationReasons(
  idObjective: number | string,
  jwtToken: string
): Promise<FetchCancellationReasonsResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const idStr = String(idObjective);
  const url = `${base}${CANCELLATION_REASON_PATH}/${encodeURIComponent(idStr)}?idObjective=${encodeURIComponent(idStr)}`;

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
      // TODO (contract): resposta não-JSON ou vazia.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão neste objetivo.
    // TODO (contract): 404 — objetivo inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 204 No Content.
      // TODO (contract): paginação.
      return { kind: "ok", reasons: normalizeCancellationReasonsPayload(data) };
    }

    // TODO (contract): 400 / 422 — id inválido.
    // TODO (contract): 429 — rate limit.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e mensagem no corpo.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
