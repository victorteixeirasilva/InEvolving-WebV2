import { API_BASE_URL } from "@/lib/constants";

const PATH = "/auth/api/motivation/dreams";

export type PostDreamPayload = {
  name: string;
  description: string;
  urlImage?: string;
};

export type PostDreamResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

export async function postDream(jwtToken: string, payload: PostDreamPayload): Promise<PostDreamResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        ...(payload.urlImage != null && payload.urlImage !== ""
          ? { urlImage: payload.urlImage }
          : {}),
      }),
    });

    try {
      await res.text();
      // TODO (contract): parse 200/201 com `id` do sonho criado para evitar refetch heurístico.
    } catch {
      // TODO (contract): corpo ilegível.
    }

    if (res.status === 401) return { kind: "unauthorized" };
    // TODO (contract): 403 / 404 / 400 / 422 / 409 / 429 / 5xx e corpo de validação.
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
