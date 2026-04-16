import { API_BASE_URL } from "@/lib/constants";
import { pickUserApiMessage, readUserApiJson } from "@/lib/user/read-user-api-response";

const PATH = "/auth/api/user/profile";

export type PatchUserProfileBody = {
  fullName: string;
  profilePictureUrl?: string | null;
  cpf: string | null;
  dateOfBirth: string | null;
  billingAddress: string | null;
  phoneNumber: string | null;
};

export type PatchUserProfileResult =
  | { kind: "ok"; message?: string }
  | { kind: "unauthorized" }
  | { kind: "validation_error"; message: string }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number; message?: string };

/**
 * PATCH `{API_BASE_URL}/auth/api/user/profile` — atualiza perfil (sem e-mail).
 */
export async function patchUserProfile(
  jwtToken: string,
  body: PatchUserProfileBody
): Promise<PatchUserProfileResult> {
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
      body: JSON.stringify(body),
    });

    const data = await readUserApiJson(res);
    const msg = pickUserApiMessage(data);

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status, message: msg ?? undefined };
    }

    if (res.status === 400) {
      return {
        kind: "validation_error",
        message: msg ?? "Dados inválidos. Verifique nome, CPF, data de nascimento, telefone e endereço.",
      };
    }

    if (res.ok && res.status === 200) {
      return { kind: "ok", message: msg ?? undefined };
    }

    if (res.status >= 500) {
      return { kind: "http_error", status: res.status, message: msg ?? undefined };
    }

    return { kind: "http_error", status: res.status, message: msg ?? undefined };
  } catch {
    return { kind: "network_error" };
  }
}
