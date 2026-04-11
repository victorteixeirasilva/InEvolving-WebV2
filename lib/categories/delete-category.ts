import { API_BASE_URL } from "@/lib/constants";

const CATEGORIES_PATH = "/auth/api/categories";

export type DeleteCategoryResult =
  | { kind: "ok"; message?: string }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function parseDeleteBody(text: string): { message?: string } {
  const t = text.trim();
  if (!t) {
    // TODO (contract): 200/204 sem corpo — considerar sucesso silencioso (comum em DELETE).
    return {};
  }
  try {
    const data = JSON.parse(t) as unknown;
    if (data !== null && typeof data === "object" && "message" in data) {
      const m = (data as { message?: unknown }).message;
      return { message: typeof m === "string" ? m : undefined };
    }
  } catch {
    // TODO (contract): corpo de sucesso não-JSON (text/plain).
  }
  return {};
}

/**
 * DELETE `{API_BASE_URL}/auth/api/categories/{categoryId}` — `Authorization: Bearer …`.
 * Sucesso típico: 200 + `{ "message": "Category removed successfully" }`.
 */
export async function deleteCategory(categoryId: string, jwtToken: string): Promise<DeleteCategoryResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${CATEGORIES_PATH}/${encodeURIComponent(categoryId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    const text = await res.text();
    const body = parseDeleteBody(text);

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão para excluir esta categoria ou plano expirado.
    // TODO (contract): 404 — categoria já removida ou id inexistente (idempotência: tratar como sucesso?).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 202 Accepted — exclusão assíncrona; polling ou webhook.
      // TODO (contract): 204 No Content — sem JSON; hoje coberto por `parseDeleteBody` vazio.
      return { kind: "ok", message: body.message };
    }

    // TODO (contract): 409 — conflito (ex.: categoria com vínculos que impedem delete).
    // TODO (contract): 400 / 422 — validação de id.
    // TODO (contract): 429 — rate limit.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e mensagem de erro no corpo (`error`, `errors`).
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
