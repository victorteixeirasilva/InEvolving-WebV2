const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asUuid(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return UUID_RE.test(s) ? s.toLowerCase() : null;
}

/**
 * Extrai o UUID do utilizador do JWT (claim `sub`, emitido pelo Gateway).
 */
export function parseJwtUserId(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return asUuid(payload.sub) ?? asUuid(payload.id) ?? asUuid(payload.userId);
}
