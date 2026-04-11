import { API_BASE_URL } from "@/lib/constants";
import type { RegisterResult } from "@/lib/auth/register-result";

const REGISTER_PATH = "/api/authentication/register";

function parseMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return "";
}

/**
 * POST `{API_BASE_URL}/api/authentication/register` — body `{ email, password }`.
 * Contrato documentado: 200 + mensagem de sucesso; 401 + "E-mail já cadastrado".
 * Outros status HTTP comuns também são tratados (400/422, 5xx, rede).
 *
 * TODO (contract): retornos a documentar — 201 Created; 409 Conflict para e-mail duplicado (em vez de 401);
 * 429 rate limiting; 403 cadastro fechado / convite obrigatório; mensagens de validação por campo em 400/422;
 * 502/503; e formato Spring (`error`, `path`) vs sempre `message`.
 */
export async function submitRegisterRequest(email: string, password: string): Promise<RegisterResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${REGISTER_PATH}`;

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

    const message = parseMessage(data);

    if (res.ok) {
      return {
        ok: true,
        message: message || "Usuário registrado com sucesso!",
      };
    }

    if (res.status === 401) {
      return {
        ok: false,
        code: "EMAIL_TAKEN",
        message: message || "E-mail já cadastrado",
      };
    }

    // TODO(contract): 409 Conflict — mesmo caso “e-mail já cadastrado”; hoje só 401 está no doc.

    if (res.status === 400 || res.status === 422) {
      // TODO(contract): lista de erros por campo (`errors`, `fieldErrors`); parsear `error`/`path` Spring quando não houver `message`.
      return {
        ok: false,
        code: "VALIDATION",
        message: message || "Dados inválidos. Verifique e-mail e senha.",
      };
    }

    // TODO(contract): 429 — rate limiting no cadastro.

    if (res.status >= 500) {
      // TODO(contract): 502/503 — mensagens ou retry distintos se padronizados.
      return {
        ok: false,
        code: "SERVER",
        message: message || "Serviço indisponível. Tente novamente em instantes.",
      };
    }

    // TODO(contract): 403 — cadastro desabilitado ou regra de negócio; hoje cai em UNKNOWN.
    return {
      ok: false,
      code: "UNKNOWN",
      message: message || "Não foi possível concluir o cadastro.",
    };
  } catch {
    // TODO(contract): timeout explícito vs falha de rede.
    return {
      ok: false,
      code: "NETWORK",
      message: "Sem conexão ou tempo esgotado. Verifique sua internet.",
    };
  }
}
