import { API_BASE_URL } from "@/lib/constants";
import type { FinancaTxCategory } from "@/lib/types/models";

const BASE = "/auth/api/finance/transaction";

const CATEGORY_PATH: Record<FinancaTxCategory, string> = {
  cost: `${BASE}/cost_of_living`,
  invest: `${BASE}/investment`,
  extra: `${BASE}/extra_contribution`,
};

export type PostFinanceTransactionPayload = {
  date: string;
  description: string;
  value: number;
};

export type PostFinanceTransactionResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * POST `{API_BASE_URL}/auth/api/finance/transaction/{cost_of_living|investment|extra_contribution}`.
 * Body `{ date, description, value }` com `date` em `YYYY-MM-DD`. Bearer token.
 */
export async function postFinanceTransaction(
  jwtToken: string,
  category: FinancaTxCategory,
  payload: PostFinanceTransactionPayload
): Promise<PostFinanceTransactionResult> {
  const path = CATEGORY_PATH[category];
  if (!path) {
    // TODO (contract): categoria desconhecida — não deveria ocorrer na UI.
    return { kind: "http_error", status: 400 };
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${path}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        date: payload.date,
        description: payload.description,
        value: payload.value,
      }),
    });

    try {
      await res.text();
      // TODO (contract): parse JSON 200 (transação criada com `id`) para atualizar lista sem refetch completo.
    } catch {
      // TODO (contract): corpo não legível em sucesso/erro.
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano.
    // TODO (contract): 404 — rota inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (res.status === 204) {
        // TODO (contract): 200 vs 204 — documentar.
        return { kind: "ok_no_body" };
      }
      // TODO (contract): 200 com corpo vazio vs objeto.
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — validação (data, valor, descrição).
    // TODO (contract): 409 — conflito.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
