import { API_BASE_URL } from "@/lib/constants";

const FORGOT_PATH = "/api/authentication/forgot";

/**
 * POST `{API_BASE_URL}/api/authentication/forgot` — body `{ userEmail }`.
 * Contrato documentado: 200 OK quando o e-mail de recuperação foi disparado.
 *
 * TODO (contract): retornos a documentar — corpo JSON em 200 (`message`?); 204 No Content como sucesso;
 * 400/422 e-mail inválido ou fora das regras; 404 e-mail não cadastrado (muitas APIs evitam e retornam sempre 200);
 * 429 rate limiting (e cabeçalho Retry-After); 403 fluxo desabilitado; 401 se exigir sessão (raro);
 * 409 “já existe pedido pendente”; 5xx e diferença 502/503; política anti-enumeração (sempre 200 com mensagem genérica).
 */
export async function submitForgotPasswordRequest(userEmail: string): Promise<{ ok: boolean }> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${FORGOT_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ userEmail: userEmail.trim() }),
    });

    if (res.ok) {
      // TODO(contract): aceitar também 201/204 se o back padronizar; validar corpo esperado se houver.
      return { ok: true };
    }

    // TODO(contract): 400/422 — mensagem de validação por campo ou Spring `error`/`path`.
    // TODO(contract): 404 — “usuário não encontrado”; decidir se a UI deve diferenciar (risco de enumeração).
    // TODO(contract): 429 — mensagem dedicada e eventual cooldown na UI.

    if (res.status >= 500) {
      // TODO(contract): 502/503 — copy ou retry distinta se documentada.
      return { ok: false };
    }

    // TODO(contract): 403 — recuperação de senha desligada para o tenant/usuário.
    return { ok: false };
  } catch {
    // TODO(contract): timeout explícito (AbortSignal) vs rede; alinhar com tempos máximos da API.
    return { ok: false };
  }
}
