import { API_BASE_URL } from "@/lib/constants";

const BOOKS_PATH = "/auth/api/books";

export type PutBookPayload = {
  title: string;
  author: string;
  theme: string;
  coverImage?: string;
};

export type PutBookResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

export async function putBook(
  jwtToken: string,
  bookId: string | number,
  payload: PutBookPayload
): Promise<PutBookResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${BOOKS_PATH}/${encodeURIComponent(String(bookId))}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        title: payload.title,
        author: payload.author,
        theme: payload.theme,
        coverImage: payload.coverImage ?? "",
      }),
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
