/**
 * Contagem de motivos de cancelamento por objetivo (localStorage).
 * Motivos vêm separados por ";" — cada segmento incrementa a contagem.
 */

const keyForObjective = (objectiveId: number | string) =>
  `inevolving_cancel_reasons_obj_${objectiveId}`;

function normalizeSegment(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Segmentos não vazios após split por ";". */
export function parseCancellationSegments(raw: string): string[] {
  return raw
    .split(";")
    .map(normalizeSegment)
    .filter((s) => s.length > 0);
}

export function recordCancellationReasons(objectiveId: number | string, raw: string) {
  if (typeof window === "undefined") return;
  const segments = parseCancellationSegments(raw);
  if (segments.length === 0) return;
  try {
    const k = keyForObjective(objectiveId);
    const prev = JSON.parse(localStorage.getItem(k) ?? "{}") as Record<string, number>;
    const next = { ...prev };
    for (const seg of segments) {
      next[seg] = (next[seg] ?? 0) + 1;
    }
    localStorage.setItem(k, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getTopCancellationReasons(
  objectiveId: number | string,
  limit = 8
): { reason: string; count: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyForObjective(objectiveId));
    if (!raw) return [];
    const obj = JSON.parse(raw) as Record<string, number>;
    return Object.entries(obj)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
      .slice(0, limit);
  } catch {
    return [];
  }
}
