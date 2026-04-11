import { API_BASE_URL } from "@/lib/constants";
import { mapApiDreamRow } from "@/lib/motivation/map-api-dream";
import type { Sonho } from "@/lib/types/models";

const PATH = "/auth/api/motivation/dreams/user";

export type FetchDreamsUserResult =
  | { kind: "ok"; dreams: Sonho[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "invalid_body" }
  | { kind: "http_error"; status: number };

export async function fetchDreamsUser(jwtToken: string): Promise<FetchDreamsUserResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown = null;
    try {
      const text = await res.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      // TODO (contract): corpo não-JSON ou vazio em 200/erro — definir fallback.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 / 404 — permissão, recurso inexistente ou rota incorreta.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (!Array.isArray(data)) {
        // TODO (contract): 200 com objeto único, wrapper `{ data: [...] }` ou paginação.
        return { kind: "invalid_body" };
      }
      const dreams: Sonho[] = [];
      for (const item of data) {
        const row = mapApiDreamRow(item);
        if (row) dreams.push(row);
      }
      return { kind: "ok", dreams };
    }

    // TODO (contract): 400 / 422 / 409 / 429 e mensagens no corpo JSON.
    if (res.status >= 500) {
      // TODO (contract): 502/503 — retry e mensagem distinta.
      return { kind: "http_error", status: res.status };
    }
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS — AbortSignal e UX de retry.
    return { kind: "network_error" };
  }
}
