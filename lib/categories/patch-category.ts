import { API_BASE_URL } from "@/lib/constants";

const CATEGORIES_PATH = "/auth/api/categories";

export type PatchCategoryInput = {
  categoryName: string;
  categoryDescription: string;
};

export type PatchCategoryResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * PATCH `{API_BASE_URL}/auth/api/categories/{categoryId}` — corpo JSON com nome/descrição.
 * Campos vazios no payload devem ser resolvidos no chamador (manter valores atuais), conforme contrato do produto.
 */
export async function patchCategory(
  categoryId: string,
  jwtToken: string,
  body: PatchCategoryInput
): Promise<PatchCategoryResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${CATEGORIES_PATH}/${encodeURIComponent(categoryId)}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        categoryName: body.categoryName,
        categoryDescription: body.categoryDescription,
      }),
    });

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano expirado.
    // TODO (contract): 404 — categoria inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 200 com corpo atualizado (`Category` / DTO) — usar na UI em vez de só confiar no formulário.
      // TODO (contract): 204 No Content — sucesso sem corpo.
      try {
        await res.text();
      } catch {
        /* ignore */
      }
      return { kind: "ok" };
    }

    // TODO (contract): 400 / 422 — validação (tamanho, caracteres); ler `message` / `errors` do JSON.
    // TODO (contract): 409 — conflito de versão ou nome duplicado.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e mensagem de erro no corpo.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}

/**
 * Monta o corpo como no fluxo legado: string vazia (após trim) mantém o valor atual da categoria.
 */
export function buildPatchCategoryBody(
  current: { categoryName: string; categoryDescription: string },
  form: { categoryName: string; categoryDescription: string }
): PatchCategoryInput {
  const nomeCategoria = form.categoryName.trim();
  const categoryDescription = (form.categoryDescription ?? "").trim();
  return {
    categoryName: nomeCategoria !== "" ? nomeCategoria : current.categoryName,
    categoryDescription:
      categoryDescription !== "" ? categoryDescription : current.categoryDescription,
  };
}
