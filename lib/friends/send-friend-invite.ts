import { API_BASE_URL } from "@/lib/constants";
import { pickUserApiMessage, readUserApiJson } from "@/lib/user/read-user-api-response";

const PATH = "/auth/api/friends/invites";

export type SendFriendInviteResult =
  | { kind: "ok"; message: string }
  | { kind: "unauthorized" }
  | { kind: "validation_error"; message: string }
  | { kind: "not_found"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number; message?: string };

const DEFAULT_OK_MESSAGE = "Convite enviado com sucesso.";
const DEFAULT_400_MESSAGE = "E-mail inválido ou regra de envio violada.";
const DEFAULT_404_MESSAGE = "Usuário não encontrado para o e-mail informado.";
const DEFAULT_409_MESSAGE = "Já existe um convite pendente para este usuário.";

/**
 * POST `{API_BASE_URL}/auth/api/friends/invites` — envia convite de amizade
 * para um usuário identificado por e-mail. O Gateway extrai o convidante do JWT.
 */
export async function sendFriendInvite(
  jwtToken: string,
  email: string
): Promise<SendFriendInviteResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await readUserApiJson(res);
    const msg = pickUserApiMessage(data);

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (res.ok && res.status === 200) {
      return { kind: "ok", message: msg ?? DEFAULT_OK_MESSAGE };
    }

    if (res.status === 400) {
      return { kind: "validation_error", message: msg ?? DEFAULT_400_MESSAGE };
    }

    if (res.status === 404) {
      return { kind: "not_found", message: msg ?? DEFAULT_404_MESSAGE };
    }

    if (res.status === 409) {
      return { kind: "conflict", message: msg ?? DEFAULT_409_MESSAGE };
    }

    return { kind: "http_error", status: res.status, message: msg ?? undefined };
  } catch {
    return { kind: "network_error" };
  }
}
