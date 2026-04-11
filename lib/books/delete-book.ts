import { API_BASE_URL } from "@/lib/constants";

const BOOKS_PATH = "/auth/api/books";

export type DeleteBookResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

export async function deleteBook(jwtToken: string, bookId: string | number): Promise<DeleteBookResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${BOOKS_PATH}/${encodeURIComponent(String(bookId))}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    try {
      await res.text();
    } catch {
      // TODO (contract): corpo em erro.
    }

    if (res.status === 401) return { kind: "unauthorized" };
    // TODO (contract): 403 / 404 / 409 / 429 / 5xx.
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
