import { API_BASE_URL } from "@/lib/constants";
import { isLikelyExceptionResponseBody, pickUserApiMessage, readUserApiJson } from "@/lib/user/read-user-api-response";

const PATH = "/auth/api/user/email";

export type PatchUserEmailResult =
  | { kind: "ok"; message: string }
  /** 200 quando o back indica que o e-mail não mudou (trim + minúsculas). */
  | { kind: "same_email"; message: string }
  | { kind: "unauthorized" }
  | { kind: "email_in_use"; message: string }
  | { kind: "validation_error"; message: string }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number; message?: string };

/**
 * PATCH `{API_BASE_URL}/auth/api/user/email` — solicita troca de e-mail (confirmação por link).
 */
export async function patchUserEmail(jwtToken: string, email: string): Promise<PatchUserEmailResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await readUserApiJson(res);
    const msg = pickUserApiMessage(data) ?? "";

    if (res.status === 401) {
      if (isLikelyExceptionResponseBody(data) && msg) {
        return { kind: "email_in_use", message: msg };
      }
      return { kind: "unauthorized" };
    }

    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status, message: msg || undefined };
    }

    if (res.status === 400) {
      return {
        kind: "validation_error",
        message: msg || "E-mail inválido ou dados rejeitados pela API.",
      };
    }

    if (res.ok && res.status === 200) {
      const lower = msg.toLowerCase();
      if (lower.includes("informe um novo") || lower.includes("novo endereço")) {
        return { kind: "same_email", message: msg || "Informe um novo endereço de e-mail." };
      }
      return {
        kind: "ok",
        message:
          msg ||
          "E-mail atualizado. Confirme o novo endereço pelo link enviado para sua caixa de entrada.",
      };
    }

    if (res.status >= 500) {
      return { kind: "http_error", status: res.status, message: msg || undefined };
    }

    return { kind: "http_error", status: res.status, message: msg || undefined };
  } catch {
    return { kind: "network_error" };
  }
}
