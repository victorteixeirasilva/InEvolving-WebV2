"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  UniqueIdentifier,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { subtasksProgress } from "@/lib/subtarefas";
import { parseLocalYmdAtNoon } from "@/lib/tasks/format-task-date-local";
import { isTaskDisplayRecurring } from "@/lib/tasks/task-display-recurring";
import { isTaskBlockedByObjectiveForEdit } from "@/lib/tasks/task-edit-policy";
import type { Tarefa, TarefaStatus } from "@/lib/types/models";
import {
  emptyKanbanOrder,
  loadKanbanOrder,
  orderedTasksForStatus,
  reconcileOrderWithTasks,
  saveKanbanOrder,
} from "@/lib/kanban-task-order";

/* ─── Meta de cada status ─── */
export const STATUS_META: Record<
  TarefaStatus,
  { label: string; color: string; bg: string; border: string; headerBg: string; icon: React.ElementType }
> = {
  PENDING:     { label: "Pendentes",     color: "text-brand-blue",          bg: "bg-brand-blue/8",      border: "border-brand-blue/25",    headerBg: "bg-brand-blue/12",    icon: QueueListIcon },
  IN_PROGRESS: { label: "Em andamento",  color: "text-brand-cyan",          bg: "bg-brand-cyan/8",      border: "border-brand-cyan/25",    headerBg: "bg-brand-cyan/12",    icon: ClockIcon },
  DONE:        { label: "Concluídas",    color: "text-emerald-400",         bg: "bg-emerald-400/8",     border: "border-emerald-400/25",   headerBg: "bg-emerald-400/12",   icon: CheckCircleIcon },
  OVERDUE:     { label: "Atrasadas",     color: "text-brand-pink",          bg: "bg-brand-pink/8",      border: "border-brand-pink/25",    headerBg: "bg-brand-pink/12",    icon: ExclamationTriangleIcon },
  CANCELLED:   { label: "Canceladas",    color: "text-[var(--text-muted)]", bg: "bg-[var(--glass-bg)]", border: "border-[var(--glass-border)]", headerBg: "bg-white/5", icon: XCircleIcon },
};

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

function taskDndId(task: Tarefa): string {
  return String(task.id);
}

function resolveOverColumn(
  overId: UniqueIdentifier | undefined | null,
  tasks: Tarefa[]
): TarefaStatus | null {
  if (overId === undefined || overId === null) return null;
  if (isStatusId(overId)) return overId;
  const sid = String(overId);
  const t = tasks.find((x) => String(x.id) === sid);
  return t?.status ?? null;
}

const kanbanCollisionDetection: CollisionDetection = (args) => {
  const inside = pointerWithin(args);
  if (inside.length > 0) return inside;
  return closestCorners(args);
};

function SharedTaskBadge({ task }: { task: Tarefa }) {
  if (!task.sharedTask) return null;
  return (
    <span
      className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-brand-cyan/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-cyan"
      title={`Categoria compartilhada · Por ${task.sharedTask.createdByName?.trim() || task.sharedTask.createdByEmail}`}
    >
      <UserGroupIcon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">Compart.</span>
    </span>
  );
}

function HasSubtasksApiBadge({ task }: { task: Tarefa }) {
  if (task.hasSubtasks !== true) return null;
  if (subtasksProgress(task)) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md bg-brand-cyan/12 px-1.5 py-0.5 text-[10px] font-medium text-brand-cyan"
      title="Esta tarefa possui subtarefas"
    >
      <QueueListIcon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      subs
    </span>
  );
}

function SubtasksProgressBadge({ task }: { task: Tarefa }) {
  const p = subtasksProgress(task);
  if (!p) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
        p.done === p.total
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-brand-blue/12 text-brand-blue dark:text-brand-cyan"
      )}
      title="Subtarefas concluídas / total"
    >
      <QueueListIcon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      {p.done}/{p.total}
    </span>
  );
}

/* ─── Card sortável (desktop): arrastar em quase tudo; só o nome abre edição ─── */
function SortableTaskCardDesktop({
  task,
  onEdit,
}: {
  task: Tarefa;
  onEdit: (t: Tarefa) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskDndId(task),
    data: { status: task.status, type: "task" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fmt = parseLocalYmdAtNoon(task.dateTask).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3",
        "transition-[box-shadow,opacity] duration-200",
        isDragging && "opacity-45 ring-2 ring-brand-cyan/35"
      )}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onEdit(task)}
        className="mb-1.5 block w-full cursor-pointer text-left text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors hover:text-brand-cyan"
      >
        {task.nameTask}
      </button>

      <div
        {...listeners}
        {...attributes}
        className="flex cursor-grab touch-none flex-col gap-2 active:cursor-grabbing"
      >
        {task.descriptionTask && (
          <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{task.descriptionTask}</p>
        )}
        {task.sharedTask && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Por{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {task.sharedTask.createdByName?.trim() || task.sharedTask.createdByEmail}
            </span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <CalendarDaysIcon className="h-3 w-3 shrink-0" aria-hidden />
          <span>{fmt}</span>
          <SharedTaskBadge task={task} />
          <SubtasksProgressBadge task={task} />
          <HasSubtasksApiBadge task={task} />
          {isTaskDisplayRecurring(task) && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-purple/15 px-1.5 py-0.5 font-medium text-brand-purple dark:text-brand-pink">
              <ArrowPathIcon className="h-3 w-3" aria-hidden />
              recorrente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Tarefa }) {
  const fmt = parseLocalYmdAtNoon(task.dateTask).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  return (
    <div
      className={cn(
        "max-w-[280px] rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3",
        "shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-2 ring-brand-cyan/60"
      )}
    >
      <p className="text-sm font-semibold text-[var(--text-primary)]">{task.nameTask}</p>
      {task.descriptionTask && (
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{task.descriptionTask}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <CalendarDaysIcon className="h-3 w-3 shrink-0" aria-hidden />
        <span>{fmt}</span>
        <SharedTaskBadge task={task} />
            <SubtasksProgressBadge task={task} />
            <HasSubtasksApiBadge task={task} />
            {isTaskDisplayRecurring(task) && (
            <span className="text-brand-purple dark:text-brand-pink">recorrente</span>
        )}
      </div>
    </div>
  );
}

/* ─── Card sortável (mobile) ─── */
function SortableTaskCardMobile({
  task,
  onEdit,
  onStatusChange,
  activeCol,
}: {
  task: Tarefa;
  onEdit: (t: Tarefa) => void;
  onStatusChange: (id: number | string, status: TarefaStatus) => void;
  activeCol: TarefaStatus;
}) {
  const meta = STATUS_META[activeCol];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskDndId(task),
    data: { status: task.status, type: "task" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fmt = parseLocalYmdAtNoon(task.dateTask).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3",
        isDragging && "opacity-50 ring-2 ring-brand-cyan/40"
      )}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(task)}
          className="block w-full cursor-pointer text-left"
        >
          <p className="font-semibold text-[var(--text-primary)] hover:text-brand-cyan transition-colors">{task.nameTask}</p>
        </button>
        <div
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab touch-none active:cursor-grabbing"
        >
          {task.descriptionTask && (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2">{task.descriptionTask}</p>
          )}
          {task.sharedTask && (
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              Por{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {task.sharedTask.createdByName?.trim() || task.sharedTask.createdByEmail}
              </span>
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <CalendarDaysIcon className="h-3 w-3" aria-hidden />
            {fmt}
            <SharedTaskBadge task={task} />
            <SubtasksProgressBadge task={task} />
            <HasSubtasksApiBadge task={task} />
            {isTaskDisplayRecurring(task) && <ArrowPathIcon className="h-3 w-3 text-brand-purple dark:text-brand-pink" aria-hidden />}
          </div>
        </div>
      </div>
      <GlassSelect
        value={task.status}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(task.id, e.target.value as TarefaStatus)}
        className={cn("w-[min(100%,9.5rem)] py-2 pl-2.5 pr-9 text-[11px] font-bold", meta.color)}
        aria-label="Mover para"
        disabled={isTaskBlockedByObjectiveForEdit(task)}
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

/* ─── Coluna ─── */
function DroppableColumn({
  status,
  orderedTasks,
  onEdit,
  isDropTarget,
  isSourceColumn,
  isDraggingBoard,
}: {
  status: TarefaStatus;
  orderedTasks: Tarefa[];
  onEdit: (t: Tarefa) => void;
  isDropTarget: boolean;
  isSourceColumn: boolean;
  isDraggingBoard: boolean;
}) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const itemIds = orderedTasks.map((t) => taskDndId(t));
  const empty = orderedTasks.length === 0;

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
        <span className={cn("truncate text-[11px] font-bold uppercase tracking-wider", meta.color)}>
          {meta.label}
        </span>
        <span className={cn("ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold", meta.bg, meta.color)}>
          {orderedTasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 overflow-y-auto p-2 transition-colors duration-200",
          "flex-1",
          empty ? "min-h-[140px]" : "min-h-[80px]",
          isDropTarget && "border border-dashed border-brand-cyan/50 bg-brand-cyan/[0.07]",
          isOver && isDropTarget && "bg-brand-cyan/15"
        )}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
              <p className="text-xs text-[var(--text-muted)]">Nenhuma</p>
              {isDropTarget && (
                <p className="text-[11px] font-semibold text-brand-cyan">Solte aqui</p>
              )}
            </div>
          ) : (
            orderedTasks.map((t) => <SortableTaskCardDesktop key={t.id} task={t} onEdit={onEdit} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function MobileKanban({
  tasks,
  columnOrder,
  onEdit,
  onStatusChange,
}: {
  tasks: Tarefa[];
  columnOrder: Record<TarefaStatus, string[]>;
  onEdit: (t: Tarefa) => void;
  onStatusChange: (id: number | string, status: TarefaStatus) => void;
}) {
  const [activeCol, setActiveCol] = useState<TarefaStatus>("PENDING");
  const meta = STATUS_META[activeCol];
  const colTasks = orderedTasksForStatus(activeCol, tasks, columnOrder);
  const itemIds = colTasks.map((t) => taskDndId(t));

  return (
    <div className="flex flex-col gap-3">
      {/* padding extra: ring do ativo não ser cortado por overflow-x */}
      <div className="flex gap-2 overflow-x-auto px-2 py-2.5 pb-3 pt-2 [-webkit-overflow-scrolling:touch] scrollbar-hide">
        {COLS.map((s) => {
          const m = STATUS_META[s];
          const count = tasks.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActiveCol(s)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200",
                "my-0.5",
                activeCol === s
                  ? cn(m.bg, m.color, "ring-1 ring-inset ring-current")
                  : "border border-[var(--glass-border)] text-[var(--text-muted)]"
              )}
            >
              {m.label}
              <span className={cn("rounded-full px-1 py-0.5 text-[10px]", activeCol === s ? m.color : "text-[var(--text-muted)]")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {colTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhuma tarefa nesta coluna</p>
          ) : (
            colTasks.map((t) => (
              <SortableTaskCardMobile
                key={t.id}
                task={t}
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

/* ─── KanbanBoard ─── */
export function KanbanBoard({
  tasks,
  onStatusChange,
  onEdit,
}: {
  tasks: Tarefa[];
  onStatusChange: (id: number | string, status: TarefaStatus) => void;
  onEdit: (t: Tarefa) => void;
}) {
  const [columnOrder, setColumnOrder] = useState<Record<TarefaStatus, string[]>>(emptyKanbanOrder);
  const [draggingTask, setDraggingTask] = useState<Tarefa | null>(null);
  const [overWhileDrag, setOverWhileDrag] = useState<UniqueIdentifier | null>(null);
  const orderHydrated = useRef(false);
  const isLg = useIsLgBreakpoint();

  useLayoutEffect(() => {
    setColumnOrder((prev) => {
      const base = orderHydrated.current ? prev : loadKanbanOrder();
      orderHydrated.current = true;
      return reconcileOrderWithTasks(base, tasks);
    });
  }, [tasks]);

  useEffect(() => {
    if (!orderHydrated.current) return;
    saveKanbanOrder(columnOrder);
  }, [columnOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const overColumn = resolveOverColumn(overWhileDrag, tasks);

  const handleDragStart = (event: DragStartEvent) => {
    const sid = String(event.active.id);
    const t = tasks.find((x) => String(x.id) === sid);
    setDraggingTask(t ?? null);
    setOverWhileDrag(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverWhileDrag(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    setOverWhileDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeTask = tasks.find((t) => String(t.id) === activeId);
    if (!activeTask) return;

    const activeCol = activeTask.status;
    const overId = over.id;

    let overCol: TarefaStatus;
    let overIndex: number;

    if (isStatusId(overId)) {
      overCol = overId;
      const ids = columnOrder[overCol].filter((id) =>
        tasks.some((t) => String(t.id) === id && t.status === overCol)
      );
      overIndex = ids.length;
    } else {
      const overSid = String(overId);
      const overTask = tasks.find((t) => String(t.id) === overSid);
      if (!overTask) return;
      overCol = overTask.status;
      const ids = columnOrder[overCol].filter((id) =>
        tasks.some((t) => String(t.id) === id && t.status === overCol)
      );
      overIndex = ids.indexOf(overSid);
      if (overIndex < 0) return;
    }

    const activeIds = columnOrder[activeCol].filter((id) =>
      tasks.some((t) => String(t.id) === id && t.status === activeCol)
    );
    const activeIndex = activeIds.indexOf(activeId);
    if (activeIndex < 0) return;

    if (activeCol === overCol) {
      if (activeId === String(overId)) return;
      if (activeIndex === overIndex) return;
      const newOrder = arrayMove(activeIds, activeIndex, overIndex);
      setColumnOrder((prev) => ({ ...prev, [activeCol]: newOrder }));
      return;
    }

    if (isTaskBlockedByObjectiveForEdit(activeTask)) return;

    onStatusChange(activeTask.id, overCol);
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
    setDraggingTask(null);
    setOverWhileDrag(null);
  };

  const isDraggingBoard = draggingTask != null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {isLg ? (
        <div className="flex gap-3" style={{ height: "calc(100vh - 240px)", minHeight: 400 }}>
          {COLS.map((status) => {
            const isCross =
              draggingTask != null && draggingTask.status !== status;
            const isTarget = isCross && overColumn === status;
            const isSource = draggingTask != null && draggingTask.status === status;
            return (
              <DroppableColumn
                key={status}
                status={status}
                orderedTasks={orderedTasksForStatus(status, tasks, columnOrder)}
                onEdit={onEdit}
                isDropTarget={isTarget}
                isSourceColumn={isSource}
                isDraggingBoard={isDraggingBoard}
              />
            );
          })}
        </div>
      ) : (
        <MobileKanban
          tasks={tasks}
          columnOrder={columnOrder}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
        />
      )}

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {draggingTask ? <TaskCardOverlay task={draggingTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
