import { STORAGE_KEYS } from "@/lib/constants";
import type { Sonho } from "@/lib/types/models";

export function normalizeSonho(
  b: Partial<Sonho> & { id: number | string; name: string; description: string }
): Sonho {
  const url = typeof b.urlImage === "string" && b.urlImage.trim() ? b.urlImage.trim() : undefined;
  return {
    id: b.id,
    name: b.name.trim(),
    description: b.description.trim(),
    urlImage: url,
    idUser: b.idUser,
  };
}

export function loadSonhos(): Sonho[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sonhosData);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return null;
    const out: Sonho[] = [];
    for (const x of p) {
      if (!x || typeof x !== "object") continue;
      const o = x as Record<string, unknown>;
      let id: string | number | null = null;
      if (typeof o.id === "string" && o.id.trim()) id = o.id.trim();
      else if (typeof o.id === "number" && Number.isFinite(o.id)) id = o.id;
      else {
        const n = Number(o.id);
        if (Number.isFinite(n)) id = n;
      }
      if (id == null) continue;
      const name = String(o.name ?? "").trim();
      const description = String(o.description ?? "").trim();
      if (!name) continue;
      out.push(
        normalizeSonho({
          id,
          name,
          description,
          urlImage: o.urlImage != null ? String(o.urlImage) : undefined,
        })
      );
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function saveSonhos(list: Sonho[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.sonhosData, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
