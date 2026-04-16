/** Lê JSON da resposta; corpo vazio vira `null`. */
export async function readUserApiJson(res: Response): Promise<unknown> {
  try {
    const text = await res.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function pickUserApiMessage(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const m = (data as Record<string, unknown>).message;
  return typeof m === "string" && m.trim() ? m.trim() : null;
}

/** Heurística para 401 com corpo `ExceptionResponse` (ex.: e-mail já cadastrado). */
export function isLikelyExceptionResponseBody(data: unknown): boolean {
  if (data == null || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return typeof o.message === "string" && o.httpStatus != null;
}
