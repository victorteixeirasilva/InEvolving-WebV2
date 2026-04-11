import type { LoginResult } from "@/lib/auth/login-result";
import { API_BASE_URL } from "@/lib/constants";

const LOGIN_PATH = "/api/authentication/login";

type LoginApiSuccess = {
  BearerToken?: string;
  bearerToken?: string;
  urlVisionBord?: string;
};

/** Resposta da API quando a conta está inativa / assinatura necessária (modal de renovação no login). */
function isInactiveAccountResponse(data: unknown, httpStatus: number): boolean {
  if (httpStatus === 402) return true;
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    o.httpStatus === "PAYMENT_REQUIRED" &&
    typeof o.message === "string" &&
    o.message === "Conta Inativa"
  );
}

function extractToken(body: LoginApiSuccess): string | null {
  if (typeof body.BearerToken === "string" && body.BearerToken.trim()) {
    return body.BearerToken.trim();
  }
  if (typeof body.bearerToken === "string" && body.bearerToken.trim()) {
    return body.bearerToken.trim();
  }
  return null;
}

/**
 * POST `{API_BASE_URL}/api/authentication/login` — body `{ email, password }`.
 * Sucesso: `BearerToken`, `urlVisionBord`. Erros: 401 e-mail não confirmado; 404 credenciais inválidas;
 * corpo `{ httpStatus: "PAYMENT_REQUIRED", message: "Conta Inativa" }` ou HTTP 402 → `PLAN_EXPIRED` (modal renovação).
 *
 * TODO (contract): retornos a documentar no back e refletir aqui — 201 Created (se diferente de 200);
 * 400/422 validação de payload; 403 plano expirou ou conta suspensa (`PLAN_EXPIRED`);
 * 429 rate limiting; 401 também para credenciais inválidas (diferenciar pelo corpo vs só e-mail não confirmado);
 * 502/503 com mensagens específicas se existirem; timeout máximo da API.
 */
export async function submitLoginRequest(email: string, password: string): Promise<LoginResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${LOGIN_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (isInactiveAccountResponse(data, res.status)) {
      return { ok: false, code: "PLAN_EXPIRED" };
    }

    if (res.ok) {
      const body = data as LoginApiSuccess;
      const token = extractToken(body);
      if (!token) {
        return { ok: false, code: "SERVER_ERROR" };
      }
      const urlVisionBord =
        typeof body.urlVisionBord === "string" ? body.urlVisionBord : undefined;
      return { ok: true, token, ...(urlVisionBord !== undefined ? { urlVisionBord } : {}) };
    }

    if (res.status === 401) {
      return { ok: false, code: "EMAIL_UNVERIFIED" };
    }

    if (res.status === 404) {
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }

    // TODO (contract): 403 — plano expirado / assinatura / conta bloqueada → mapear para `PLAN_EXPIRED` quando o back padronizar.
    // TODO (contract): 429 — Too Many Requests; mensagem e eventual Retry-After.

    if (res.status >= 500) {
      // TODO (contract): 502 Bad Gateway / 503 Service Unavailable — copy ou retry distintos se documentados.
      return { ok: false, code: "SERVER_ERROR" };
    }

    // TODO (contract): 400/422 — corpo de validação (campos); hoje cai em erro genérico.
    return { ok: false, code: "SERVER_ERROR" };
  } catch {
    // TODO(contract): distinguir timeout vs rede indisponível se a API ou cliente definir tempos máximos.
    return { ok: false, code: "SERVER_ERROR" };
  }
}
