import { API_BASE_URL } from "@/lib/constants";

const WAGE_PATH = "/auth/api/finance/wage";

export type PatchFinanceWageResult =
  | { kind: "ok" }
  /** 204 ou corpo vazio em sucesso. */
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * PATCH `{API_BASE_URL}/auth/api/finance/wage` — atualiza salário.
 * Body `{ "wage": number }`. Header `Authorization: Bearer …`.
 */
export async function patchFinanceWage(
  jwtToken: string,
  wage: number
): Promise<PatchFinanceWageResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${WAGE_PATH}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ wage }),
    });

    try {
      await res.text();
      // TODO (contract): parse JSON de sucesso (ex.: wage confirmado) quando o back padronizar.
    } catch {
      // TODO (contract): leitura do corpo em erro/sucesso.
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano.
    // TODO (contract): 404 — rota inexistente no ambiente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (res.status === 204) {
        // TODO (contract): 200 vs 204 — documentar.
        return { kind: "ok_no_body" };
      }
      // TODO (contract): 200 com corpo útil vs vazio.
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — validação (valor negativo, limite, formato).
    // TODO (contract): 409 — conflito de versão.
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
