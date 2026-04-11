import { STORAGE_KEYS } from "@/lib/constants";
import type { Livro, LivroStatus } from "@/lib/types/models";

const VALID_STATUS: LivroStatus[] = ["PENDENTE_LEITURA", "LENDO", "LEITURA_FINALIZADA"];

function migrateStatus(raw: string | undefined): LivroStatus {
  const v = (raw ?? "").toLowerCase();
  if (v === "lendo" || v === "progress" || v === "in_progress") return "LENDO";
  if (v === "leitura_finalizada" || v === "done" || v === "finalizado") return "LEITURA_FINALIZADA";
  return "PENDENTE_LEITURA";
}

function normalizeStatus(s: unknown): LivroStatus {
  if (typeof s === "string" && VALID_STATUS.includes(s as LivroStatus)) return s as LivroStatus;
  return migrateStatus(typeof s === "string" ? s : undefined);
}

export function normalizeLivro(
  b: Partial<Livro> & { id: number | string; title: string; author: string; theme: string }
): Livro {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    theme: b.theme,
    status: normalizeStatus(b.status),
    coverImage: typeof b.coverImage === "string" && b.coverImage.trim() ? b.coverImage.trim() : undefined,
    idUser: b.idUser,
  };
}

export function loadLivros(): Livro[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.livrosData);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return null;
    const out: Livro[] = [];
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
      const title = String(o.title ?? "");
      const author = String(o.author ?? "");
      const theme = String(o.theme ?? "");
      if (!title || !author) continue;
      out.push(
        normalizeLivro({
          id,
          title,
          author,
          theme,
          status: normalizeStatus(o.status),
          coverImage: o.coverImage != null ? String(o.coverImage) : undefined,
        })
      );
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function saveLivros(books: Livro[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.livrosData, JSON.stringify(books));
  } catch {
    /* ignore */
  }
}
