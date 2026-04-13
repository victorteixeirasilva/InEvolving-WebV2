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
      console.error(`[FetchBooks] Failed to parse JSON for ${endpointKey}:`, url);
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (res.status === 403 || res.status === 404) {
      console.warn(`[FetchBooks] ${endpointKey} returned status ${res.status}:`, url);
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      if (!Array.isArray(data)) {
        console.error(`[FetchBooks] ${endpointKey} returned non-array body:`, data);
        return { kind: "invalid_body" };
      }
      return { kind: "ok", books: parseBooksArray(data, endpointKey) };
    }

    console.error(`[FetchBooks] ${endpointKey} failed with status ${res.status}:`, url);
    return { kind: "http_error", status: res.status };
  } catch (err) {
    console.error(`[FetchBooks] Network error for ${endpointKey}:`, err);
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

export type FetchAllBooksResult = {
  todo: FetchBooksListResult;
  progress: FetchBooksListResult;
  completed: FetchBooksListResult;
};

/**
 * Carrega as três listas de forma independente e devolve os estados individuais.
 */
export async function fetchAllBooksForUser(jwtToken: string): Promise<FetchAllBooksResult> {
  const [todo, progress, completed] = await Promise.all([
    fetchBooksTodo(jwtToken),
    fetchBooksProgress(jwtToken),
    fetchBooksCompleted(jwtToken),
  ]);

  return { todo, progress, completed };
}
