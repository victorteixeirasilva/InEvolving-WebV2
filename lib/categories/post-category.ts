import { API_BASE_URL } from "@/lib/constants";

const CATEGORIES_PATH = "/auth/api/categories";

export type PostCategoryInput = {
  categoryName: string;
  categoryDescription: string;
};

export type PostCategoryResult =
  | { kind: "ok"; id: string }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function pickCategoryIdValue(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/**
 * Extrai o UUID (ou id string) da categoria criada a partir do JSON de resposta.
 */
function parseCreatedCategoryId(body: unknown): string | null {
  // TODO (contract): formato oficial (ex.: só `id`, `categoryId`, objeto `Category` completo, ou wrapper `{ data }`).
  if (body === null || typeof body !== "object") {
    return null;
  }
  const o = body as Record<string, unknown>;
  const id = pickCategoryIdValue(o.id) ?? pickCategoryIdValue(o.idCategory);
  if (id) return id;
  const data = o.data;
  if (data !== null && typeof data === "object") {
    return pickCategoryIdValue((data as Record<string, unknown>).id);
  }
  return null;
}

/**
 * POST `{API_BASE_URL}/auth/api/categories` — cria categoria.
 */
export async function postCategory(
  jwtToken: string,
  input: PostCategoryInput
): Promise<PostCategoryResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${CATEGORIES_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        categoryName: input.categoryName,
        categoryDescription: input.categoryDescription,
      }),
    });

    const text = await res.text();
    let data: unknown = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        // TODO (contract): 200 com corpo não-JSON.
        data = null;
      }
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — plano expirado ou sem permissão para criar.
    if (res.status === 403) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 201 Created com `Location` e corpo vazio — obter id do header.
      // TODO (contract): 204 — improvável em POST; definir comportamento.
      const id = parseCreatedCategoryId(data);
      if (id === null) {
        // TODO (contract): id obrigatório no contrato — falhar explicitamente ou refetch lista.
        return { kind: "http_error", status: res.status };
      }
      return { kind: "ok", id };
    }

    // TODO (contract): 400 / 422 — validação; mensagens por campo no JSON.
    // TODO (contract): 409 — nome duplicado ou regra de negócio.
    // TODO (contract): 404 — rota errada em algum ambiente.
    // TODO (contract): 429 — rate limit.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e corpo de erro padronizado.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
