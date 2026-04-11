import { API_BASE_URL } from "@/lib/constants";

const UPDATE_PATH = "/api/authentication/forgot/update";

function parseMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return "";
}

/**
 * PUT `{API_BASE_URL}/api/authentication/forgot/update` — body `{ idToken, newPassword }`.
 * Contrato documentado pelo produto: sucesso HTTP “ok”; falha com tratamento genérico na UI.
 *
 * TODO(contract): retornos a documentar — corpo em sucesso (`message`?); 200 vs 204 No Content;
 * 400/422 regras de senha e erros por campo; 401 token inválido; 403 token já consumido ou política;
 * 404 token inexistente; 410 Gone link expirado (comum em reset); 409 conflito (ex.: mesma senha antiga);
 * 429 rate limiting; 5xx e diferença 502/503; formato Spring (`error`, `path`) sem `message`;
 * se o token pode ir em header em vez do body; tempo de expiração do link e cópias oficiais de erro.
 */
export async function submitResetPasswordRequest(
  idToken: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${UPDATE_PATH}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ idToken: idToken.trim(), newPassword }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    const message = parseMessage(data);

    if (res.ok) {
      // TODO(contract): aceitar 204 sem corpo; validar payload de sucesso se existir.
      return { ok: true };
    }

    // TODO(contract): 410 Gone — link expirado; hoje pode cair em 401/404 conforme o back.

    if (res.status === 400 || res.status === 422) {
      // TODO(contract): lista `errors`/`fieldErrors`; parsear `error` Spring quando não houver `message`.
      return {
        ok: false,
        message: message || "Dados inválidos. Verifique a nova senha e tente novamente.",
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          message ||
          "Link inválido, expirado ou não autorizado. Solicite um novo e-mail em Esqueci minha senha.",
      };
    }

    if (res.status === 404) {
      // TODO(contract): distinguir “token inexistente” vs “usuário não encontrado” se a API expuser com segurança.
      return {
        ok: false,
        message: message || "Token não encontrado ou já utilizado.",
      };
    }

    // TODO(contract): 429 — mensagem dedicada e cooldown na UI.

    if (res.status >= 500) {
      // TODO(contract): 502/503 — copy ou retry distinta se documentada.
      return {
        ok: false,
        message: message || "Serviço indisponível. Tente novamente em instantes.",
      };
    }

    // TODO(contract): 409 — ex.: nova senha igual à anterior, se o back retornar esse caso.
    return {
      ok: false,
      message: message || "Erro ao alterar a senha. Por favor, tente novamente.",
    };
  } catch {
    // TODO(contract): timeout (AbortSignal) vs rede; alinhar com SLA da API.
    return {
      ok: false,
      message: "Falha de conexão. Verifique sua internet e tente de novo.",
    };
  }
}
