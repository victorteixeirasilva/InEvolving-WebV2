import { STORAGE_KEYS } from "@/lib/constants";
import type { FinancaTransacaoView, FinancaTxCategory, ResponseFinancas } from "@/lib/types/models";

export function txIdKey(id: string | number): string {
  return String(id);
}

export function mergeFinancasTransactionsForMonth(
  data: ResponseFinancas,
  monthKey: string
): FinancaTransacaoView[] {
  const m = monthKey;
  const toMonth = (d: string) => d.slice(0, 7);

  const rows: FinancaTransacaoView[] = [];
  for (const t of data.transactionsCostOfLiving) {
    if (toMonth(t.date) !== m) continue;
    rows.push({ ...t, id: txIdKey(t.id), category: "cost" });
  }
  for (const t of data.transactionsInvestment) {
    if (toMonth(t.date) !== m) continue;
    rows.push({ ...t, id: txIdKey(t.id), category: "invest" });
  }
  for (const t of data.transactionsExtraAdded) {
    if (toMonth(t.date) !== m) continue;
    rows.push({ ...t, id: txIdKey(t.id), category: "extra" });
  }
  return rows;
}

export type FinancasTxPersistedMonth = {
  order: string[];
  hidden: string[];
};

export type FinancasTxPersisted = Record<string, FinancasTxPersistedMonth>;

function parsePersisted(): FinancasTxPersisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.financasTxState);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (p && typeof p === "object" && !Array.isArray(p)) return p as FinancasTxPersisted;
  } catch {
    /* ignore */
  }
  return {};
}

export function loadFinancasTxMonth(monthKey: string): FinancasTxPersistedMonth {
  if (typeof window === "undefined") return { order: [], hidden: [] };
  const all = parsePersisted();
  const cur = all[monthKey];
  return {
    order: Array.isArray(cur?.order) ? cur.order.map(String) : [],
    hidden: Array.isArray(cur?.hidden) ? cur.hidden.map(String) : [],
  };
}

export function saveFinancasTxMonth(monthKey: string, state: FinancasTxPersistedMonth) {
  try {
    const all = parsePersisted();
    all[monthKey] = {
      order: [...state.order],
      hidden: [...state.hidden],
    };
    localStorage.setItem(STORAGE_KEYS.financasTxState, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** Junta ordem salva com ids atuais; inclui novos ao fim ordenados por data (desc). */
export function reconcileFinancasTxOrder(
  byId: Map<string, FinancaTransacaoView>,
  saved: FinancasTxPersistedMonth
): { order: string[]; hidden: string[] } {
  const allIds = Array.from(byId.keys());
  const allSet = new Set(allIds);

  const hidden = new Set(saved.hidden.filter((id) => allSet.has(id)));

  let order = saved.order.filter((id) => allSet.has(id));
  const inOrder = new Set(order);
  const missing = allIds.filter((id) => !inOrder.has(id));
  missing.sort((a, b) => {
    const da = byId.get(a)?.date ?? "";
    const db = byId.get(b)?.date ?? "";
    if (da !== db) return db.localeCompare(da);
    return a.localeCompare(b);
  });
  order = [...order, ...missing];

  return { order, hidden: Array.from(hidden) };
}

export function mergeOrderAfterPartialReorder(
  fullOrder: string[],
  visibleOrdered: string[],
  reorderedVisible: string[]
): string[] {
  const vis = new Set(visibleOrdered);
  if (vis.size !== new Set(reorderedVisible).size) return fullOrder;
  const result = [...fullOrder];
  let vi = 0;
  for (let i = 0; i < result.length; i++) {
    if (vis.has(result[i])) {
      result[i] = reorderedVisible[vi++];
    }
  }
  return result;
}

export const FINANCA_TX_CATEGORY_LABEL: Record<FinancaTxCategory, string> = {
  cost: "Custo de vida",
  invest: "Investimentos",
  extra: "Entradas extras",
};

export function apiTypeForCategory(cat: FinancaTxCategory): string {
  switch (cat) {
    case "cost":
      return "Cost of Living";
    case "invest":
      return "Investment";
    case "extra":
      return "Extra Contribution";
    default:
      return "Cost of Living";
  }
}

type LocalAddsStore = Record<string, FinancaTransacaoView[]>;

function parseLocalAdds(): LocalAddsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.financasTxLocalAdds);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (p && typeof p === "object" && !Array.isArray(p)) return p as LocalAddsStore;
  } catch {
    /* ignore */
  }
  return {};
}

export function loadLocalAdds(monthKey: string): FinancaTransacaoView[] {
  if (typeof window === "undefined") return [];
  const all = parseLocalAdds();
  const list = all[monthKey];
  if (!Array.isArray(list)) return [];
  return list.filter(
    (r) =>
      r &&
      typeof r.id === "string" &&
      typeof r.date === "string" &&
      typeof r.description === "string" &&
      typeof r.value === "number" &&
      (r.category === "cost" || r.category === "invest" || r.category === "extra")
  ) as FinancaTransacaoView[];
}

export function saveLocalAdds(monthKey: string, rows: FinancaTransacaoView[]) {
  try {
    const all = parseLocalAdds();
    all[monthKey] = rows;
    localStorage.setItem(STORAGE_KEYS.financasTxLocalAdds, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function appendLocalTransaction(row: FinancaTransacaoView) {
  const monthKey = row.date.slice(0, 7);
  const cur = loadLocalAdds(monthKey);
  saveLocalAdds(monthKey, [...cur, row]);
}
