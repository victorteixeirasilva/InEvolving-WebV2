"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  type UniqueIdentifier,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpenIcon,
  BookmarkIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { LivroFormModal } from "@/components/features/livros/LivroFormModal";
import type { LivroFormSavePayload } from "@/components/features/livros/LivroFormModal";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { deleteBook } from "@/lib/books/delete-book";
import { patchBookStatus } from "@/lib/books/patch-book-status";
import { postBook } from "@/lib/books/post-book";
import { putBook } from "@/lib/books/put-book";
import { livroIdKey } from "@/lib/books/livro-id";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  emptyLivrosKanbanOrder,
  loadLivrosKanbanOrder,
  orderedLivrosForStatus,
  reconcileLivrosOrderWithBooks,
  saveLivrosKanbanOrder,
} from "@/lib/kanban-livros-order";
import type { Livro, LivroStatus } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const COLS: LivroStatus[] = ["PENDENTE_LEITURA", "LENDO", "LEITURA_FINALIZADA"];

const STATUS_META: Record<
  LivroStatus,
  { label: string; color: string; bg: string; border: string; headerBg: string; icon: React.ElementType }
> = {
  PENDENTE_LEITURA: {
    label: "Pendente leitura",
    color: "text-brand-blue",
    bg: "bg-brand-blue/8",
    border: "border-brand-blue/25",
    headerBg: "bg-brand-blue/12",
    icon: BookOpenIcon,
  },
  LENDO: {
    label: "Lendo",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/8",
    border: "border-brand-cyan/25",
    headerBg: "bg-brand-cyan/12",
    icon: BookmarkIcon,
  },
  LEITURA_FINALIZADA: {
    label: "Leitura finalizada",
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/25",
    headerBg: "bg-emerald-400/12",
    icon: CheckCircleIcon,
  },
};

const LG_QUERY = "(min-width: 1024px)";

function useIsLgBreakpoint() {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const m = window.matchMedia(LG_QUERY);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(LG_QUERY).matches : false),
    () => false
  );
}

function isStatusId(id: UniqueIdentifier): id is LivroStatus {
  return COLS.includes(id as LivroStatus);
}

function findBookByDndId(books: Livro[], id: UniqueIdentifier): Livro | undefined {
  const sid = String(id);
  return books.find((b) => livroIdKey(b.id) === sid);
}

function resolveOverColumn(overId: UniqueIdentifier | undefined | null, books: Livro[]): LivroStatus | null {
  if (overId === undefined || overId === null) return null;
  if (isStatusId(overId)) return overId;
  const b = findBookByDndId(books, overId);
  return b?.status ?? null;
}

function readJwtFromStorage(): string {
  try {
    return String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
  } catch {
    return "";
  }
}

const livrosCollisionDetection: CollisionDetection = (args) => {
  const inside = pointerWithin(args);
  if (inside.length > 0) return inside;
  return closestCorners(args);
};

function BookCoverThumb({ src, title }: { src?: string; title: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div
        className="flex h-[72px] w-[52px] shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/[0.04] dark:bg-white/[0.03]"
        aria-hidden
      >
        <BookOpenIcon className="h-9 w-9 text-[var(--text-muted)]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-[72px] w-[52px] shrink-0 rounded-lg object-cover ring-1 ring-[var(--glass-border)]"
      onError={() => setErr(true)}
    />
  );
}

function SortableBookCardDesktop({
  book,
  onEdit,
  onDelete,
}: {
  book: Livro;
  onEdit: (b: Livro) => void;
  onDelete: (id: string | number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: livroIdKey(book.id),
    data: { status: book.status, type: "book" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5",
        "transition-[box-shadow,opacity] duration-200",
        isDragging && "opacity-45 ring-2 ring-brand-cyan/35"
      )}
    >
      <div className="flex gap-2.5">
        <div {...listeners} {...attributes} className="cursor-grab touch-none active:cursor-grabbing">
          <BookCoverThumb src={book.coverImage} title={book.title} />
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(book)}
            className="block w-full text-left text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors hover:text-brand-cyan"
          >
            {book.title}
          </button>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{book.author}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand-cyan">{book.theme}</p>
          <div className="mt-2 flex gap-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit(book)}
              className="inline-flex rounded-lg border border-[var(--glass-border)] p-1.5 text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-brand-cyan"
              aria-label={`Editar ${book.title}`}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete(book.id)}
              className="inline-flex rounded-lg border border-red-500/30 p-1.5 text-red-600 hover:bg-red-500/10 dark:text-red-400"
              aria-label={`Remover ${book.title}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCardOverlay({ book }: { book: Livro }) {
  return (
    <div
      className={cn(
        "max-w-[280px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5",
        "shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-2 ring-brand-cyan/60"
      )}
    >
      <div className="flex gap-2">
        <BookCoverThumb src={book.coverImage} title={book.title} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{book.title}</p>
          <p className="text-xs text-[var(--text-muted)]">{book.author}</p>
        </div>
      </div>
    </div>
  );
}

function SortableBookCardMobile({
  book,
  onEdit,
  onDelete,
  onStatusChange,
  activeCol,
}: {
  book: Livro;
  onEdit: (b: Livro) => void;
  onDelete: (id: string | number) => void;
  onStatusChange: (id: string | number, status: LivroStatus) => void;
  activeCol: LivroStatus;
}) {
  const meta = STATUS_META[activeCol];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: livroIdKey(book.id),
    data: { status: book.status, type: "book" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5",
        isDragging && "opacity-50 ring-2 ring-brand-cyan/40"
      )}
    >
      <div {...listeners} {...attributes} className="cursor-grab touch-none shrink-0 active:cursor-grabbing">
        <BookCoverThumb src={book.coverImage} title={book.title} />
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(book)}
          className="block w-full text-left text-sm font-semibold text-[var(--text-primary)] hover:text-brand-cyan"
        >
          {book.title}
        </button>
        <p className="text-xs text-[var(--text-muted)]">{book.author}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase text-brand-cyan">{book.theme}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <GlassSelect
            value={book.status}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange(book.id, e.target.value as LivroStatus)}
            className={cn("w-[min(100%,11rem)] py-2 pl-2.5 pr-9 text-[11px] font-bold", meta.color)}
            aria-label="Mover para coluna"
          >
            {COLS.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </GlassSelect>
          <button
            type="button"
            onClick={() => onEdit(book)}
            className="inline-flex rounded-lg border border-[var(--glass-border)] p-1.5 text-[var(--text-muted)]"
            aria-label="Editar"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(book.id)}
            className="inline-flex rounded-lg border border-red-500/30 p-1.5 text-red-600 dark:text-red-400"
            aria-label="Remover"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  status,
  orderedBooks,
  onEdit,
  onDelete,
  isDropTarget,
  isSourceColumn,
  isDraggingBoard,
  loading,
  error,
}: {
  status: LivroStatus;
  orderedBooks: Livro[];
  onEdit: (b: Livro) => void;
  onDelete: (id: string | number) => void;
  isDropTarget: boolean;
  isSourceColumn: boolean;
  isDraggingBoard: boolean;
  loading: boolean;
  error: string | null;
}) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const itemIds = orderedBooks.map((b) => livroIdKey(b.id));
  const empty = orderedBooks.length === 0;

  const getEmptyMessage = (s: LivroStatus) => {
    switch (s) {
      case "PENDENTE_LEITURA":
        return "Você ainda não adicionou livros para ler";
      case "LENDO":
        return "Nenhum livro em andamento no momento";
      case "LEITURA_FINALIZADA":
        return "Nenhum livro finalizado ainda";
      default:
        return "Nenhum livro";
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col rounded-2xl border transition-all duration-300",
        meta.border,
        isDraggingBoard && isSourceColumn && "opacity-[0.72]",
        isDropTarget && "z-[1] scale-[1.01] ring-2 ring-brand-cyan ring-offset-2 ring-offset-[var(--glass-bg)] dark:ring-offset-black/40",
        isOver && isDropTarget && "bg-brand-cyan/12"
      )}
    >
      <div className={cn("flex items-center gap-2 rounded-t-2xl px-3 py-2.5", meta.headerBg)}>
        <meta.icon className={cn("h-4 w-4 shrink-0", meta.color)} aria-hidden />
        <span className={cn("truncate text-[11px] font-bold uppercase tracking-wider", meta.color)}>{meta.label}</span>
        <span className={cn("ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold", meta.bg, meta.color)}>
          {orderedBooks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 overflow-y-auto p-2 transition-colors duration-200",
          "flex-1",
          empty || loading || error ? "min-h-[160px]" : "min-h-[80px]",
          isDropTarget && "border border-dashed border-brand-cyan/50 bg-brand-cyan/[0.07]",
          isOver && isDropTarget && "bg-brand-cyan/15"
        )}
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
            <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {empty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
                <p className="px-4 text-xs text-[var(--text-muted)]">{getEmptyMessage(status)}</p>
                {isDropTarget && <p className="text-[11px] font-semibold text-brand-cyan">Solte aqui</p>}
              </div>
            ) : (
              orderedBooks.map((b) => (
                <SortableBookCardDesktop key={livroIdKey(b.id)} book={b} onEdit={onEdit} onDelete={onDelete} />
              ))
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function MobileKanban({
  books,
  columnOrder,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
  error,
  activeCol,
  setActiveCol,
}: {
  books: Livro[];
  columnOrder: Record<LivroStatus, string[]>;
  onEdit: (b: Livro) => void;
  onDelete: (id: string | number) => void;
  onStatusChange: (id: string | number, status: LivroStatus) => void;
  loading: boolean;
  error: string | null;
  activeCol: LivroStatus;
  setActiveCol: (s: LivroStatus) => void;
}) {
  const colBooks = orderedLivrosForStatus(activeCol, books, columnOrder);
  const itemIds = colBooks.map((b) => livroIdKey(b.id));

  const getEmptyMessage = (s: LivroStatus) => {
    switch (s) {
      case "PENDENTE_LEITURA":
        return "Você ainda não adicionou livros para ler";
      case "LENDO":
        return "Nenhum livro em andamento no momento";
      case "LEITURA_FINALIZADA":
        return "Nenhum livro finalizado ainda";
      default:
        return "Nenhum livro";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto px-2 py-2.5 pb-3 pt-2 [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {COLS.map((s) => {
          const m = STATUS_META[s];
          const count = books.filter((b) => b.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActiveCol(s)}
              className={cn(
                "my-0.5 inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                activeCol === s
                  ? cn(m.bg, m.color, "ring-1 ring-inset ring-current")
                  : "border border-[var(--glass-border)] text-[var(--text-muted)]"
              )}
            >
              {m.label}
              <span
                className={cn(
                  "rounded-full px-1 py-0.5 text-[10px]",
                  activeCol === s ? m.color : "text-[var(--text-muted)]"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 min-h-[200px]">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {colBooks.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--text-muted)] px-6">
                {getEmptyMessage(activeCol)}
              </p>
            ) : (
              colBooks.map((b) => (
                <SortableBookCardMobile
                  key={livroIdKey(b.id)}
                  book={b}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  activeCol={activeCol}
                />
              ))
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export type CategoryStatus = {
  loading: boolean;
  error: string | null;
};

export type LivrosKanbanBoardProps = {
  books: Livro[];
  setBooks: Dispatch<SetStateAction<Livro[]>>;
  categoryStates: Record<LivroStatus, CategoryStatus>;
  refetchBooks: () => Promise<Livro[] | null>;
  onUnauthorized: () => void;
};

export function LivrosKanbanBoard({
  books,
  setBooks,
  categoryStates,
  refetchBooks,
  onUnauthorized,
}: LivrosKanbanBoardProps) {
  const [columnOrder, setColumnOrder] = useState<Record<LivroStatus, string[]>>(emptyLivrosKanbanOrder);
  const [draggingBook, setDraggingBook] = useState<Livro | null>(null);
  const [overWhileDrag, setOverWhileDrag] = useState<UniqueIdentifier | null>(null);
  const orderHydrated = useRef(false);
  const isLg = useIsLgBreakpoint();

  const [activeCol, setActiveCol] = useState<LivroStatus>("PENDENTE_LEITURA");

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Livro | null>(null);

  useLayoutEffect(() => {
    setColumnOrder((prev) => {
      const base = orderHydrated.current ? prev : loadLivrosKanbanOrder();
      orderHydrated.current = true;
      return reconcileLivrosOrderWithBooks(base, books);
    });
  }, [books]);

  useEffect(() => {
    if (!orderHydrated.current) return;
    saveLivrosKanbanOrder(columnOrder);
  }, [columnOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const overColumn = resolveOverColumn(overWhileDrag, books);

  const handleDragStart = (event: DragStartEvent) => {
    const b = findBookByDndId(books, event.active.id);
    setDraggingBook(b ?? null);
    setOverWhileDrag(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverWhileDrag(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingBook(null);
    setOverWhileDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeBook = findBookByDndId(books, active.id);
    if (!activeBook) return;

    const activeKey = livroIdKey(activeBook.id);
    const activeCol = activeBook.status;
    const overId = over.id;

    let overCol: LivroStatus;
    let overIndex: number;

    if (isStatusId(overId)) {
      overCol = overId;
      const ids = columnOrder[overCol].filter((key) =>
        books.some((b) => livroIdKey(b.id) === key && b.status === overCol)
      );
      overIndex = ids.length;
    } else {
      const overBook = findBookByDndId(books, overId);
      if (!overBook) return;
      overCol = overBook.status;
      const ids = columnOrder[overCol].filter((key) =>
        books.some((b) => livroIdKey(b.id) === key && b.status === overCol)
      );
      const overKey = livroIdKey(overBook.id);
      overIndex = ids.indexOf(overKey);
      if (overIndex < 0) return;
    }

    const activeIds = columnOrder[activeCol].filter((key) =>
      books.some((b) => livroIdKey(b.id) === key && b.status === activeCol)
    );
    const activeIndex = activeIds.indexOf(activeKey);
    if (activeIndex < 0) return;

    if (activeCol === overCol) {
      if (!isStatusId(overId)) {
        const ob = findBookByDndId(books, overId);
        if (ob && livroIdKey(ob.id) === activeKey) return;
      }
      if (activeIndex === overIndex) return;
      const newOrder = arrayMove(activeIds, activeIndex, overIndex);
      setColumnOrder((prev) => ({ ...prev, [activeCol]: newOrder }));
      return;
    }

    const snapBooks = books.map((b) => ({ ...b }));
    const snapOrder: Record<LivroStatus, string[]> = {
      PENDENTE_LEITURA: [...columnOrder.PENDENTE_LEITURA],
      LENDO: [...columnOrder.LENDO],
      LEITURA_FINALIZADA: [...columnOrder.LEITURA_FINALIZADA],
    };

    setBooks((prev) =>
      prev.map((b) => (livroIdKey(b.id) === activeKey ? { ...b, status: overCol } : b))
    );
    setColumnOrder((prev) => {
      const from = prev[activeCol].filter((k) => k !== activeKey);
      const to = prev[overCol].filter((k) => k !== activeKey);
      let insertAt = overIndex;
      if (isStatusId(overId)) insertAt = to.length;
      to.splice(insertAt, 0, activeKey);
      return { ...prev, [activeCol]: from, [overCol]: to };
    });

    void (async () => {
      const jwt = readJwtFromStorage();
      if (!jwt) {
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        window.alert("Sessão expirada ou token ausente.");
        // TODO (contract): área logada sem token — alinhar com `/login` ou refresh de sessão.
        return;
      }
      const r = await patchBookStatus(jwt, activeBook.id, overCol);
      if (r.kind === "unauthorized") {
        onUnauthorized();
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        return;
      }
      if (r.kind !== "ok" && r.kind !== "ok_no_body") {
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        window.alert("Não foi possível atualizar o status do livro.");
        // TODO (contract): mensagem do corpo JSON em 4xx/5xx.
        return;
      }
      await refetchBooks();
    })();
  };

  const handleDragCancel = () => {
    setDraggingBook(null);
    setOverWhileDrag(null);
  };

  const handleStatusChange = useCallback(
    async (id: string | number, status: LivroStatus) => {
      const snapBooks = books.map((b) => ({ ...b }));
      const snapOrder: Record<LivroStatus, string[]> = {
        PENDENTE_LEITURA: [...columnOrder.PENDENTE_LEITURA],
        LENDO: [...columnOrder.LENDO],
        LEITURA_FINALIZADA: [...columnOrder.LEITURA_FINALIZADA],
      };
      const idKey = livroIdKey(id);
      setBooks((prev) => prev.map((b) => (livroIdKey(b.id) === idKey ? { ...b, status } : b)));

      const jwt = readJwtFromStorage();
      if (!jwt) {
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        window.alert("Sessão expirada ou token ausente.");
        return;
      }
      const r = await patchBookStatus(jwt, id, status);
      if (r.kind === "unauthorized") {
        onUnauthorized();
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        return;
      }
      if (r.kind !== "ok" && r.kind !== "ok_no_body") {
        setBooks(snapBooks);
        setColumnOrder(snapOrder);
        window.alert("Não foi possível atualizar o status do livro.");
        return;
      }
      await refetchBooks();
    },
    [books, columnOrder, onUnauthorized, refetchBooks, setBooks]
  );

  const openNew = () => {
    setEditingBook(null);
    setFormOpen(true);
  };

  const openEdit = (b: Livro) => {
    setEditingBook(b);
    setFormOpen(true);
  };

  const handleFormSave = async (payload: LivroFormSavePayload) => {
    const jwt = readJwtFromStorage();
    if (!jwt) {
      throw new Error("Sessão expirada ou token ausente.");
    }

    if (payload.id != null) {
      const r = await putBook(jwt, payload.id, {
        title: payload.title,
        author: payload.author,
        theme: payload.theme,
        coverImage: payload.coverImage,
      });
      if (r.kind === "unauthorized") {
        onUnauthorized();
        throw new Error("Sessão expirada.");
      }
      if (r.kind !== "ok" && r.kind !== "ok_no_body") {
        throw new Error("Não foi possível salvar as alterações do livro.");
      }
      const prevStatus = editingBook?.status;
      if (prevStatus != null && prevStatus !== payload.status) {
        const pr = await patchBookStatus(jwt, payload.id, payload.status);
        if (pr.kind === "unauthorized") {
          onUnauthorized();
          throw new Error("Sessão expirada.");
        }
        if (pr.kind !== "ok" && pr.kind !== "ok_no_body") {
          throw new Error("Dados salvos, mas não foi possível mover o livro de coluna.");
        }
      }
      await refetchBooks();
      return;
    }

    const r = await postBook(jwt, {
      title: payload.title,
      author: payload.author,
      theme: payload.theme,
      coverImage: payload.coverImage,
    });
    if (r.kind === "unauthorized") {
      onUnauthorized();
      throw new Error("Sessão expirada.");
    }
    if (r.kind !== "ok" && r.kind !== "ok_no_body") {
      throw new Error("Não foi possível cadastrar o livro.");
    }

    const oldKeys = new Set(books.map((b) => livroIdKey(b.id)));
    const list = await refetchBooks();
    if (list == null) {
      throw new Error("Livro cadastrado, mas não foi possível atualizar a lista.");
    }
    const created = list.find((b) => !oldKeys.has(livroIdKey(b.id)));
    if (created && payload.status !== "PENDENTE_LEITURA") {
      const pr = await patchBookStatus(jwt, created.id, payload.status);
      if (pr.kind === "unauthorized") {
        onUnauthorized();
        throw new Error("Sessão expirada.");
      }
      if (pr.kind === "ok" || pr.kind === "ok_no_body") {
        await refetchBooks();
      } else {
        throw new Error("Livro criado, mas não foi possível definir o status inicial escolhido.");
      }
    }
  };

  const handleDelete = async (id: string | number) => {
    if (typeof window !== "undefined" && !window.confirm("Remover este livro da lista?")) return;
    const jwt = readJwtFromStorage();
    if (!jwt) {
      window.alert("Sessão expirada ou token ausente.");
      return;
    }
    const r = await deleteBook(jwt, id);
    if (r.kind === "unauthorized") {
      onUnauthorized();
      return;
    }
    if (r.kind !== "ok" && r.kind !== "ok_no_body") {
      window.alert("Não foi possível remover o livro.");
      // TODO (contract): corpo de erro em 409/404.
      return;
    }
    await refetchBooks();
  };

  const isDraggingBoard = draggingBook != null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Arraste entre colunas ou use o menu no celular. Capas vêm da URL informada (ou ícone quando falhar).
        </p>
        <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={openNew}>
          <BookOpenIcon className="h-5 w-5" aria-hidden />
          Novo livro
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={livrosCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {isLg ? (
          <div className="flex gap-3" style={{ height: "calc(100vh - 280px)", minHeight: 420 }}>
            {COLS.map((status) => {
              const isCross = draggingBook != null && draggingBook.status !== status;
              const isTarget = isCross && overColumn === status;
              const isSource = draggingBook != null && draggingBook.status === status;
              return (
                <DroppableColumn
                  key={status}
                  status={status}
                  orderedBooks={orderedLivrosForStatus(status, books, columnOrder)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isDropTarget={isTarget}
                  isSourceColumn={isSource}
                  isDraggingBoard={isDraggingBoard}
                  loading={categoryStates[status].loading}
                  error={categoryStates[status].error}
                />
              );
            })}
          </div>
        ) : (
          <MobileKanban
            books={books}
            columnOrder={columnOrder}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            loading={categoryStates[activeCol].loading}
            error={categoryStates[activeCol].error}
            activeCol={activeCol}
            setActiveCol={setActiveCol}
          />
        )}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
          {draggingBook ? <BookCardOverlay book={draggingBook} /> : null}
        </DragOverlay>
      </DndContext>

      <LivroFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editingBook={editingBook}
        onSave={handleFormSave}
      />
    </div>
  );
}
