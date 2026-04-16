import { API_BASE_URL } from "@/lib/constants";
import { readUserApiJson } from "@/lib/user/read-user-api-response";

const PATH = "/auth/api/user/profile";

/** Resposta de GET `/auth/api/user/profile`. */
export type UserProfileResponse = {
  email: string;
  emailVerified: boolean;
  lastLogin: string;
  isActive: boolean;
  fullName: string;
  profilePictureUrl: string | null;
  cpf: string | null;
  dateOfBirth: string | null;
  billingAddress: string | null;
  phoneNumber: string | null;
  dataDaProximaRenovacao: string | null;
};

export type FetchUserProfileResult =
  | { kind: "ok"; data: UserProfileResponse }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "invalid_body" }
  | { kind: "http_error"; status: number };

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asStr(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function asStrOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function parseUserProfileResponse(body: unknown): UserProfileResponse | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const email = asStr(o.email);
  if (!email) return null;

  return {
    email,
    emailVerified: asBool(o.emailVerified),
    lastLogin: asStr(o.lastLogin),
    isActive: asBool(o.isActive, true),
    fullName: asStr(o.fullName),
    profilePictureUrl: asStrOrNull(o.profilePictureUrl),
    cpf: asStrOrNull(o.cpf),
    dateOfBirth: asStrOrNull(o.dateOfBirth),
    billingAddress: asStrOrNull(o.billingAddress),
    phoneNumber: asStrOrNull(o.phoneNumber),
    dataDaProximaRenovacao: asStrOrNull(o.dataDaProximaRenovacao),
  };
}

/**
 * GET `{API_BASE_URL}/auth/api/user/profile` — perfil do usuário autenticado.
 */
export async function fetchUserProfile(jwtToken: string): Promise<FetchUserProfileResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const data = await readUserApiJson(res);

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      const parsed = parseUserProfileResponse(data);
      if (!parsed) return { kind: "invalid_body" };
      return { kind: "ok", data: parsed };
    }

    if (res.status >= 500) {
      return { kind: "http_error", status: res.status };
    }

    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
