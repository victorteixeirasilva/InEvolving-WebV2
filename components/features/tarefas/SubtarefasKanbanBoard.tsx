"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
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
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { STATUS_META } from "@/components/features/tarefas/KanbanBoard";
import { GlassSelect } from "@/components/ui/GlassSelect";
import {
  emptySubtaskKanbanOrder,
  orderedSubtasksForStatus,
  reconcileSubtaskOrderWithSubtasks,
} from "@/lib/kanban-subtask-order";
import type { TarefaSubtarefa, TarefaStatus } from "@/lib/types/models";
import { parseLocalYmdAtNoon } from "@/lib/tasks/format-task-date-local";
import { cn } from "@/lib/utils";

const COLS: TarefaStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE", "CANCELLED"];

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

function isStatusId(id: UniqueIdentifier): id is TarefaStatus {
  return COLS.includes(id as TarefaStatus);
}

function resolveOverColumn(
  overId: UniqueIdentifier | undefined | null,
  subtasks: TarefaSubtarefa[]
): TarefaStatus | null {
  if (overId === undefined || overId === null) return null;
  if (isStatusId(overId)) return overId;
  const sid = String(overId);
  const s = subtasks.find((x) => x.id === sid);
  return s?.status ?? null;
}

const subKanbanCollisionDetection: CollisionDetection = (args) => {
  const inside = pointerWithin(args);
  if (inside.length > 0) return inside;
  return closestCorners(args);
};

function SortableSubCardDesktop({ sub, onEdit }: { sub: TarefaSubtarefa; onEdit: (s: TarefaSubtarefa) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sub.id,
    data: { status: sub.status, type: "subtask" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const fmt = parseLocalYmdAtNoon(sub.dateTask).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

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
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onEdit(sub)}
        className="mb-1 block w-full cursor-pointer text-left text-xs font-semibold leading-snug text-[var(--text-primary)] hover:text-brand-cyan"
      >
        {sub.nameTask}
      </button>
      <div {...listeners} {...attributes} className="flex cursor-grab touch-none flex-col gap-1 active:cursor-grabbing">
        {sub.descriptionTask ? (
          <p className="line-clamp-2 text-[11px] text-[var(--text-muted)]">{sub.descriptionTask}</p>
        ) : null}
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          <CalendarDaysIcon className="h-3 w-3 shrink-0" aria-hidden />
          <span>{fmt}</span>
        </div>
      </div>
    </div>
  );
}

function SubCardOverlay({ sub }: { sub: TarefaSubtarefa }) {
  const fmt = parseLocalYmdAtNoon(sub.dateTask).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return (
    <div
      className={cn(
        "max-w-[220px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5",
        "shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-2 ring-brand-cyan/60"
      )}
    >
      <p className="text-xs font-semibold text-[var(--text-primary)]">{sub.nameTask}</p>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <CalendarDaysIcon className="h-3 w-3" aria-hidden />
        {fmt}
      </div>
    </div>
  );
}

function SortableSubCardMobile({
  sub,
  onEdit,
  onStatusChange,
  activeCol,
}: {
  sub: TarefaSubtarefa;
  onEdit: (s: TarefaSubtarefa) => void;
  onStatusChange: (id: string, status: TarefaStatus) => void;
  activeCol: TarefaStatus;
}) {
  const meta = STATUS_META[activeCol];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sub.id,
    data: { status: sub.status, type: "subtask" },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const fmt = parseLocalYmdAtNoon(sub.dateTask).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5",
        isDragging && "opacity-50 ring-2 ring-brand-cyan/40"
      )}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(sub)}
          className="block w-full cursor-pointer text-left text-xs font-semibold text-[var(--text-primary)] hover:text-brand-cyan"
        >
          {sub.nameTask}
        </button>
        <div {...listeners} {...attributes} className="mt-0.5 cursor-grab touch-none active:cursor-grabbing">
          {sub.descriptionTask ? (
            <p className="line-clamp-2 text-[11px] text-[var(--text-muted)]">{sub.descriptionTask}</p>
          ) : null}
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <CalendarDaysIcon className="h-3 w-3" aria-hidden />
            {fmt}
          </div>
        </div>
      </div>
      <GlassSelect
        value={sub.status}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(sub.id, e.target.value as TarefaStatus)}
        className={cn("w-[min(100%,9rem)] py-1.5 pl-2 pr-8 text-[10px] font-bold", meta.color)}
        aria-label="Mover para"
      >
        {COLS.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </GlassSelect>
    </div>
  );
}

function DroppableSubColumn({
  status,
  orderedSubs,
  onEdit,
  isDropTarget,
  isSourceColumn,
  isDraggingBoard,
}: {
  status: TarefaStatus;
  orderedSubs: TarefaSubtarefa[];
  onEdit: (s: TarefaSubtarefa) => void;
  isDropTarget: boolean;
  isSourceColumn: boolean;
  isDraggingBoard: boolean;
}) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const itemIds = orderedSubs.map((s) => s.id);
  const empty = orderedSubs.length === 0;

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
      <div className={cn("flex items-center gap-2 rounded-t-2xl px-2.5 py-2", meta.headerBg)}>
        <meta.icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} aria-hidden />
        <span className={cn("truncate text-[10px] font-bold uppercase tracking-wider", meta.color)}>{meta.label}</span>
        <span className={cn("ml-auto shrink-0 rounded-full px-1 py-0.5 text-[10px] font-bold", meta.bg, meta.color)}>
          {orderedSubs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-1.5 overflow-y-auto p-1.5 transition-colors duration-200",
          "flex-1",
          empty ? "min-h-[100px]" : "min-h-[60px]",
          isDropTarget && "border border-dashed border-brand-cyan/50 bg-brand-cyan/[0.07]",
          isOver && isDropTarget && "bg-brand-cyan/15"
        )}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-4 text-center">
              <p className="text-[10px] text-[var(--text-muted)]">Nenhuma</p>
              {isDropTarget ? <p className="text-[10px] font-semibold text-brand-cyan">Solte aqui</p> : null}
            </div>
          ) : (
            orderedSubs.map((s) => <SortableSubCardDesktop key={s.id} sub={s} onEdit={onEdit} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function MobileSubKanban({
  subtasks,
  columnOrder,
  onEdit,
  onStatusChange,
}: {
  subtasks: TarefaSubtarefa[];
  columnOrder: Record<TarefaStatus, string[]>;
  onEdit: (s: TarefaSubtarefa) => void;
  onStatusChange: (id: string, status: TarefaStatus) => void;
}) {
  const [activeCol, setActiveCol] = useState<TarefaStatus>("PENDING");
  const meta = STATUS_META[activeCol];
  const colSubs = orderedSubtasksForStatus(activeCol, subtasks, columnOrder);
  const itemIds = colSubs.map((s) => s.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 overflow-x-auto px-1 py-1.5 [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {COLS.map((s) => {
          const m = STATUS_META[s];
          const count = subtasks.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActiveCol(s)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-200",
                activeCol === s ? cn(m.bg, m.color, "ring-1 ring-inset ring-current") : "border border-[var(--glass-border)] text-[var(--text-muted)]"
              )}
            >
              {m.label}
              <span className={cn("rounded-full px-1 text-[9px]", activeCol === s ? m.color : "text-[var(--text-muted)]")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5">
          {colSubs.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">Nenhuma subtarefa nesta coluna</p>
          ) : (
            colSubs.map((s) => (
              <SortableSubCardMobile
                key={s.id}
                sub={s}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
                activeCol={activeCol}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export type SubtarefasKanbanBoardProps = {
  subtasks: TarefaSubtarefa[];
  onSubtasksChange: (next: TarefaSubtarefa[]) => void;
  onEditSubtask: (s: TarefaSubtarefa) => void;
};

export function SubtarefasKanbanBoard({ subtasks, onSubtasksChange, onEditSubtask }: SubtarefasKanbanBoardProps) {
  const [columnOrder, setColumnOrder] = useState<Record<TarefaStatus, string[]>>(emptySubtaskKanbanOrder);
  const [dragging, setDragging] = useState<TarefaSubtarefa | null>(null);
  const [overWhileDrag, setOverWhileDrag] = useState<UniqueIdentifier | null>(null);
  const orderReady = useRef(false);
  const isLg = useIsLgBreakpoint();

  useLayoutEffect(() => {
    setColumnOrder((prev) => {
      const base = orderReady.current ? prev : emptySubtaskKanbanOrder();
      orderReady.current = true;
      return reconcileSubtaskOrderWithSubtasks(base, subtasks);
    });
  }, [subtasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const overColumn = resolveOverColumn(overWhileDrag, subtasks);

  const applyStatus = (id: string, status: TarefaStatus) => {
    onSubtasksChange(subtasks.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const sid = String(event.active.id);
    setDragging(subtasks.find((x) => x.id === sid) ?? null);
    setOverWhileDrag(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverWhileDrag(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    setOverWhileDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeSub = subtasks.find((s) => s.id === activeId);
    if (!activeSub) return;

    const activeCol = activeSub.status;
    const overId = over.id;

    let overCol: TarefaStatus;
    let overIndex: number;

    if (isStatusId(overId)) {
      overCol = overId;
      const ids = columnOrder[overCol].filter((id) => subtasks.some((s) => s.id === id && s.status === overCol));
      overIndex = ids.length;
    } else {
      const overStr = String(overId);
      const overSub = subtasks.find((s) => s.id === overStr);
      if (!overSub) return;
      overCol = overSub.status;
      const ids = columnOrder[overCol].filter((id) => subtasks.some((s) => s.id === id && s.status === overCol));
      overIndex = ids.indexOf(overStr);
      if (overIndex < 0) return;
    }

    const activeIds = columnOrder[activeCol].filter((id) => subtasks.some((s) => s.id === id && s.status === activeCol));
    const activeIndex = activeIds.indexOf(activeId);
    if (activeIndex < 0) return;

    if (activeCol === overCol) {
      if (activeId === String(overId)) return;
      if (activeIndex === overIndex) return;
      const newOrder = arrayMove(activeIds, activeIndex, overIndex);
      setColumnOrder((prev) => ({ ...prev, [activeCol]: newOrder }));
      return;
    }

    onSubtasksChange(subtasks.map((s) => (s.id === activeId ? { ...s, status: overCol } : s)));
    setColumnOrder((prev) => {
      const from = prev[activeCol].filter((id) => id !== activeId);
      const to = prev[overCol].filter((id) => id !== activeId);
      let insertAt = overIndex;
      if (isStatusId(overId)) insertAt = to.length;
      to.splice(insertAt, 0, activeId);
      return { ...prev, [activeCol]: from, [overCol]: to };
    });
  };

  const handleDragCancel = () => {
    setDragging(null);
    setOverWhileDrag(null);
  };

  const isDraggingBoard = dragging != null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={subKanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {isLg ? (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ minHeight: 280, maxHeight: "min(45vh, 360px)" }}>
          {COLS.map((status) => {
            const isCross = dragging != null && dragging.status !== status;
            const isTarget = isCross && overColumn === status;
            const isSource = dragging != null && dragging.status === status;
            return (
              <DroppableSubColumn
                key={status}
                status={status}
                orderedSubs={orderedSubtasksForStatus(status, subtasks, columnOrder)}
                onEdit={onEditSubtask}
                isDropTarget={isTarget}
                isSourceColumn={isSource}
                isDraggingBoard={isDraggingBoard}
              />
            );
          })}
        </div>
      ) : (
        <MobileSubKanban
          subtasks={subtasks}
          columnOrder={columnOrder}
          onEdit={onEditSubtask}
          onStatusChange={applyStatus}
        />
      )}
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {dragging ? <SubCardOverlay sub={dragging} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
