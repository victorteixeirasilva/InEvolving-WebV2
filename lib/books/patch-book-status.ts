import { API_BASE_URL } from "@/lib/constants";
import type { LivroStatus } from "@/lib/types/models";

const BOOKS_PREFIX = "/auth/api/books";

export type PatchBookStatusResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function pathForStatus(status: LivroStatus): string | null {
  switch (status) {
    case "PENDENTE_LEITURA":
      return `${BOOKS_PREFIX}/status/todo`;
    case "LENDO":
      return `${BOOKS_PREFIX}/status/progress`;
    case "LEITURA_FINALIZADA":
      return `${BOOKS_PREFIX}/status/completed`;
    default:
      return null;
  }
}

export async function patchBookStatus(
  jwtToken: string,
  bookId: string | number,
  status: LivroStatus
): Promise<PatchBookStatusResult> {
  const seg = pathForStatus(status);
  if (!seg) {
    // TODO (contract): status desconhecido.
    return { kind: "http_error", status: 400 };
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${seg}/${encodeURIComponent(String(bookId))}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    try {
      await res.text();
      // TODO (contract): parse corpo 200.
    } catch {
      // TODO (contract): corpo ilegível.
    }

    if (res.status === 401) return { kind: "unauthorized" };
    // TODO (contract): 403 / 404 / 400 / 422 / 409 / 429 / 5xx.
    if (res.status === 403 || res.status === 404) return { kind: "http_error", status: res.status };
    if (res.ok) {
      if (res.status === 204) return { kind: "ok_no_body" };
      return { kind: "ok" };
    }
    if (res.status >= 500) return { kind: "http_error", status: res.status };
    return { kind: "http_error", status: res.status };
  } catch {
    return { kind: "network_error" };
  }
}
