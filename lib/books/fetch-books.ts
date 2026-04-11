import { API_BASE_URL } from "@/lib/constants";
import { livroIdKey } from "@/lib/books/livro-id";
import { mapApiLivroRow, statusFromBooksEndpoint } from "@/lib/books/map-api-livro";
import type { Livro } from "@/lib/types/models";

const BOOKS_PREFIX = "/auth/api/books";

export type FetchBooksListResult =
  | { kind: "ok"; books: Livro[] }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "invalid_body" }
  | { kind: "http_error"; status: number };

function parseBooksArray(data: unknown, endpoint: "todo" | "progress" | "completed"): Livro[] {
  if (!Array.isArray(data)) return [];
  const st = statusFromBooksEndpoint(endpoint);
  const out: Livro[] = [];
  for (const item of data) {
    const b = mapApiLivroRow(item, st);
    if (b) out.push(b);
  }
  return out;
}

async function fetchBooksByStatusPath(
  jwtToken: string,
  pathSuffix: "status/todo" | "status/progress" | "status/completed",
  endpointKey: "todo" | "progress" | "completed"
): Promise<FetchBooksListResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${BOOKS_PREFIX}/${pathSuffix}`;

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
      // TODO (contract): corpo não-JSON ou vazio.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 / 404.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (!Array.isArray(data)) {
        // TODO (contract): 200 com objeto único ou wrapper `data`.
        return { kind: "invalid_body" };
      }
      return { kind: "ok", books: parseBooksArray(data, endpointKey) };
    }

    // TODO (contract): 400 / 422 / 409 / 429 / 5xx.
    if (res.status >= 500) {
      return { kind: "http_error", status: res.status };
    }
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}

export function fetchBooksTodo(jwt: string) {
  return fetchBooksByStatusPath(jwt, "status/todo", "todo");
}
export function fetchBooksProgress(jwt: string) {
  return fetchBooksByStatusPath(jwt, "status/progress", "progress");
}
export function fetchBooksCompleted(jwt: string) {
  return fetchBooksByStatusPath(jwt, "status/completed", "completed");
}

/**
 * Carrega as três listas e devolve um único array (dedupe por `id`).
 */
export async function fetchAllBooksForUser(jwtToken: string): Promise<FetchBooksListResult> {
  const [a, b, c] = await Promise.all([
    fetchBooksTodo(jwtToken),
    fetchBooksProgress(jwtToken),
    fetchBooksCompleted(jwtToken),
  ]);

  if (a.kind === "unauthorized" || b.kind === "unauthorized" || c.kind === "unauthorized") {
    return { kind: "unauthorized" };
  }
  if (a.kind === "network_error" || b.kind === "network_error" || c.kind === "network_error") {
    return { kind: "network_error" };
  }
  const anyInvalid = [a, b, c].some((r) => r.kind === "invalid_body");
  if (anyInvalid) {
    return { kind: "invalid_body" };
  }
  const anyHttp = [a, b, c].find((r) => r.kind === "http_error");
  if (anyHttp && anyHttp.kind === "http_error") {
    return { kind: "http_error", status: anyHttp.status };
  }

  const merged: Livro[] = [];
  const seen = new Set<string>();
  for (const r of [a, b, c]) {
    if (r.kind !== "ok") continue;
    for (const book of r.books) {
      const k = livroIdKey(book.id);
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(book);
    }
  }
  return { kind: "ok", books: merged };
}
