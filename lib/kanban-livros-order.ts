import { livroIdKey } from "@/lib/books/livro-id";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Livro, LivroStatus } from "@/lib/types/models";

const COLS: LivroStatus[] = ["PENDENTE_LEITURA", "LENDO", "LEITURA_FINALIZADA"];

/** Ordem local no Kanban — chaves estáveis (`livroIdKey`) para UUID ou id numérico. */
export function emptyLivrosKanbanOrder(): Record<LivroStatus, string[]> {
  return {
    PENDENTE_LEITURA: [],
    LENDO: [],
    LEITURA_FINALIZADA: [],
  };
}

function coerceStoredOrderId(x: unknown): string | null {
  if (typeof x === "string" && x.trim()) return x.trim();
  const n = Number(x);
  if (Number.isFinite(n)) return livroIdKey(n);
  return null;
}

export function loadLivrosKanbanOrder(): Record<LivroStatus, string[]> {
  if (typeof window === "undefined") return emptyLivrosKanbanOrder();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.livrosKanbanOrder);
    if (!raw) return emptyLivrosKanbanOrder();
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const result = emptyLivrosKanbanOrder();
    for (const s of COLS) {
      const arr = parsed[s];
      result[s] = Array.isArray(arr)
        ? arr.map((x) => coerceStoredOrderId(x)).filter((k): k is string => k != null)
        : [];
    }
    return result;
  } catch {
    return emptyLivrosKanbanOrder();
  }
}

export function saveLivrosKanbanOrder(order: Record<LivroStatus, string[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.livrosKanbanOrder, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function reconcileLivrosOrderWithBooks(
  order: Record<LivroStatus, string[]>,
  books: Pick<Livro, "id" | "status">[]
): Record<LivroStatus, string[]> {
  const next = emptyLivrosKanbanOrder();
  for (const status of COLS) {
    const validKeys = new Set(
      books.filter((b) => b.status === status).map((b) => livroIdKey(b.id))
    );
    const prev = order[status] ?? [];
    const merged: string[] = [];
    for (const key of prev) {
      if (validKeys.has(key)) {
        merged.push(key);
        validKeys.delete(key);
      }
    }
    const rest = Array.from(validKeys).sort((a, b) => a.localeCompare(b));
    next[status] = [...merged, ...rest];
  }
  return next;
}

export function orderedLivrosForStatus(
  status: LivroStatus,
  books: Livro[],
  order: Record<LivroStatus, string[]>
): Livro[] {
  const inColumn = books.filter((b) => b.status === status);
  const byKey = new Map(inColumn.map((b) => [livroIdKey(b.id), b]));
  const ids = order[status] ?? [];
  const out: Livro[] = [];
  for (const id of ids) {
    const b = byKey.get(id);
    if (b) out.push(b);
  }
  if (out.length === 0 && inColumn.length > 0) {
    return [...inColumn].sort((a, b) => livroIdKey(a.id).localeCompare(livroIdKey(b.id)));
  }
  return out;
}
