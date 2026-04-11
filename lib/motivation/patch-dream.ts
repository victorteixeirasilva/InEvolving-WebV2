import { API_BASE_URL } from "@/lib/constants";

const PATH = "/auth/api/motivation/dreams";

export type PatchDreamPayload = {
  id: string | number;
  name: string;
  description: string;
  urlImage?: string;
};

export type PatchDreamResult =
  | { kind: "ok" }
  | { kind: "ok_no_body" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

export async function patchDream(jwtToken: string, payload: PatchDreamPayload): Promise<PatchDreamResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${PATH}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        urlImage: payload.urlImage ?? "",
        id: payload.id,
      }),
    });

    try {
      await res.text();
      // TODO (contract): parse corpo 200 com entidade atualizada.
    } catch {
      // TODO (contract): corpo ilegível.
    }

    if (res.status === 401) return { kind: "unauthorized" };
    // TODO (contract): 403 / 404 (id inexistente) / 400 / 422 / 409 / 429 / 5xx.
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
