"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, DocumentDuplicateIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FinancasTransactionFormModal } from "@/components/features/financas/FinancasTransactionFormModal";
import type { FinancasTransactionFormInitial } from "@/components/features/financas/FinancasTransactionFormModal";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { STORAGE_KEYS } from "@/lib/constants";
import { postFinanceTransaction } from "@/lib/finance/post-finance-transaction";
import {
  appendLocalTransaction,
  FINANCA_TX_CATEGORY_LABEL,
  loadFinancasTxMonth,
  loadLocalAdds,
  mergeFinancasTransactionsForMonth,
  mergeOrderAfterPartialReorder,
  reconcileFinancasTxOrder,
  saveFinancasTxMonth,
  saveLocalAdds,
} from "@/lib/financas-transactions";
import { toDateInputValue } from "@/lib/tasks/format-task-date-local";
import type { FinancaTransacaoView, FinancaTxCategory, ResponseFinancas } from "@/lib/types/models";
import { cn } from "@/lib/utils";

function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type FilterValue = "all" | FinancaTxCategory;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "cost", label: FINANCA_TX_CATEGORY_LABEL.cost },
  { value: "invest", label: FINANCA_TX_CATEGORY_LABEL.invest },
  { value: "extra", label: FINANCA_TX_CATEGORY_LABEL.extra },
];

function categoryBadgeClass(cat: FinancaTxCategory) {
  switch (cat) {
    case "cost":
      return "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan";
    case "invest":
      return "border-brand-purple/30 bg-brand-purple/10 text-brand-purple dark:text-brand-pink";
    case "extra":
      return "border-brand-pink/30 bg-brand-pink/10 text-brand-pink";
    default:
      return "border-[var(--glass-border)] text-[var(--text-muted)]";
  }
}

function SortableTxRow({
  row,
  onRemove,
  onDuplicate,
}: {
  row: FinancaTransacaoView;
  onRemove: (id: string) => void;
  onDuplicate: (row: FinancaTransacaoView) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-2 rounded-xl border border-[var(--glass-border)] bg-white/[0.02] p-2.5 dark:bg-white/[0.02]",
        isDragging && "z-10 opacity-90 shadow-glass-lg ring-2 ring-brand-cyan/30"
      )}
    >
      <button
        type="button"
        className="inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-[var(--glass-border)] px-1.5 text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)] active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="h-5 w-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <span
            className={cn(
              "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              categoryBadgeClass(row.category)
            )}
          >
            {FINANCA_TX_CATEGORY_LABEL[row.category]}
          </span>
          <span className="text-xs text-[var(--text-muted)]">{formatDate(row.date)}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{row.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-1">
        <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
          {formatBrl(row.value)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(row)}
            className="inline-flex rounded-lg border border-[var(--glass-border)] p-1.5 text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-brand-cyan"
            aria-label={`Duplicar ${row.description}`}
          >
            <DocumentDuplicateIcon className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onRemove(row.id)}
            className="inline-flex rounded-lg border border-red-500/30 p-1.5 text-red-600 hover:bg-red-500/10 dark:text-red-400"
            aria-label={`Remover ${row.description}`}
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export type FinancasTransactionsPanelProps = {
  selectedMonth: string;
  data: ResponseFinancas;
  /** Após POST bem-sucedido: refetch silencioso do período (atualiza cards e listas). */
  refetchFinance: () => Promise<void>;
  onUnauthorized: () => void;
};

export function FinancasTransactionsPanel({
  selectedMonth,
  data,
  refetchFinance,
  onUnauthorized,
}: FinancasTransactionsPanelProps) {
  const [localAdds, setLocalAdds] = useState<FinancaTransacaoView[]>([]);

  useEffect(() => {
    setLocalAdds(loadLocalAdds(selectedMonth));
  }, [selectedMonth]);

  const merged = useMemo(() => {
    const api = mergeFinancasTransactionsForMonth(data, selectedMonth);
    return [...api, ...localAdds];
  }, [data, selectedMonth, localAdds]);

  const byId = useMemo(() => new Map(merged.map((r) => [r.id, r] as const)), [merged]);
  const idsSig = useMemo(() => merged.map((r) => r.id).sort().join("|"), [merged]);

  const [filter, setFilter] = useState<FilterValue>("all");
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [formVariant, setFormVariant] = useState<"create" | "duplicate">("create");
  const [formInitial, setFormInitial] = useState<FinancasTransactionFormInitial | null>(null);

  useEffect(() => {
    const saved = loadFinancasTxMonth(selectedMonth);
    const rec = reconcileFinancasTxOrder(byId, saved);
    setOrder(rec.order);
    setHidden(new Set(rec.hidden));
  }, [selectedMonth, idsSig, byId]);

  const persist = useCallback(
    (nextOrder: string[], nextHidden: Set<string>) => {
      saveFinancasTxMonth(selectedMonth, {
        order: nextOrder,
        hidden: Array.from(nextHidden),
      });
    },
    [selectedMonth]
  );

  const matchesFilter = useCallback(
    (row: FinancaTransacaoView | undefined) => {
      if (!row) return false;
      if (filter === "all") return true;
      return row.category === filter;
    },
    [filter]
  );

  const visibleOrdered = useMemo(() => {
    return order.filter((id) => !hidden.has(id) && matchesFilter(byId.get(id)));
  }, [order, hidden, matchesFilter, byId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const vis = order.filter((id) => !hidden.has(id) && matchesFilter(byId.get(id)));
    const oldIndex = vis.indexOf(activeId);
    const newIndex = vis.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;
    const reorderedVisible = arrayMove(vis, oldIndex, newIndex);
    const nextOrder = mergeOrderAfterPartialReorder(order, vis, reorderedVisible);
    setOrder(nextOrder);
    persist(nextOrder, hidden);
  };

  const onRemove = (id: string) => {
    if (id.startsWith("local-")) {
      const row = byId.get(id);
      if (row) {
        const m = row.date.slice(0, 7);
        const list = loadLocalAdds(m);
        const nextList = list.filter((x) => x.id !== id);
        saveLocalAdds(m, nextList);
        if (m === selectedMonth) setLocalAdds(nextList);
      }
      const nextOrder = order.filter((x) => x !== id);
      setOrder(nextOrder);
      persist(nextOrder, hidden);
      return;
    }
    const nextHidden = new Set(hidden);
    nextHidden.add(id);
    setHidden(nextHidden);
    persist(order, nextHidden);
  };

  const openCreateForm = () => {
    setFormVariant("create");
    setFormInitial(null);
    setFormOpen(true);
  };

  const openDuplicateForm = (row: FinancaTransacaoView) => {
    setFormVariant("duplicate");
    setFormInitial({
      description: row.description,
      value: row.value,
      date: row.date,
      category: row.category,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = useCallback(
    async (row: FinancaTransacaoView) => {
      let jwt = "";
      try {
        jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwt) {
        appendLocalTransaction(row);
        const m = row.date.slice(0, 7);
        if (m === selectedMonth) {
          setLocalAdds(loadLocalAdds(selectedMonth));
        }
        return;
      }

      const dateYmd =
        toDateInputValue(row.date) || (row.date.length >= 10 ? row.date.slice(0, 10) : row.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
        throw new Error("Data inválida.");
      }

      const result = await postFinanceTransaction(jwt, row.category, {
        date: dateYmd,
        description: row.description.trim(),
        value: row.value,
      });

      if (result.kind === "unauthorized") {
        onUnauthorized();
        throw new Error("Sessão expirada ou inválida.");
      }
      if (result.kind === "network_error") {
        throw new Error("Falha de conexão. Verifique sua internet.");
      }
      if (result.kind !== "ok" && result.kind !== "ok_no_body") {
        // TODO (UX): mensagem por status HTTP quando o back padronizar corpo de erro.
        throw new Error("Não foi possível registrar a transação. Tente novamente.");
      }

      await refetchFinance();
    },
    [selectedMonth, onUnauthorized, refetchFinance]
  );

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Transações do mês</h2>
          {/* <p className="mt-1 text-sm text-[var(--text-muted)]">
            Lista unificada do JSON (custo de vida, investimentos e entradas). Filtre, reordene ou oculte
            itens — preferências ficam neste dispositivo até a API substituir.
          </p> */}
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Filtre, reordene, adicione ou remova transações.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
          <div className="w-full min-w-[180px] sm:max-w-[220px]">
            <label htmlFor="fin-tx-filter" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
              Tipo
            </label>
            <GlassSelect
              id="fin-tx-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterValue)}
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </GlassSelect>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 whitespace-nowrap sm:w-auto"
            onClick={openCreateForm}
          >
            <PlusIcon className="h-5 w-5" aria-hidden />
            Nova transação
          </Button>
        </div>
      </div>

      {visibleOrdered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-[var(--glass-border)] py-10 text-center text-sm text-[var(--text-muted)]">
          {merged.length === 0
            ? "Nenhuma transação neste mês."
            : "Nenhuma transação neste filtro (ou todas foram removidas da visualização)."}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visibleOrdered} strategy={verticalListSortingStrategy}>
            <ul className="mt-5 max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1">
              {visibleOrdered.map((id) => {
                const row = byId.get(id);
                if (!row) return null;
                return (
                  <SortableTxRow key={id} row={row} onRemove={onRemove} onDuplicate={openDuplicateForm} />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <FinancasTransactionFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedMonth={selectedMonth}
        variant={formVariant}
        initial={formInitial}
        onSubmit={handleFormSubmit}
      />
    </GlassCard>
  );
}
