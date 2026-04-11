"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDaysIcon, PlusCircleIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { DevSectionNotice } from "@/components/ui/DevSectionNotice";
import { Input } from "@/components/ui/Input";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { DateField } from "@/components/ui/DateField";
import { RecurringTaskSwitch } from "@/components/ui/RecurringTaskSwitch";
import { EditarSubtarefaModal } from "@/components/features/tarefas/EditarSubtarefaModal";
import { SubtarefasKanbanBoard } from "@/components/features/tarefas/SubtarefasKanbanBoard";
import {
  getTopCancellationReasons,
  parseCancellationSegments,
  recordCancellationReasons,
} from "@/lib/cancel-reasons-storage";
import { buildGoogleCalendarEventEditUrl } from "@/lib/google-calendar-url";
import { migrateSubtasksFromParent, stripEmptySubtasks, syncSubtasksObjective } from "@/lib/subtarefas";
import { deleteCollaborativeTask, updateCollaborativeTask } from "@/lib/shared-category-tasks-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchObjectivesTodoUser } from "@/lib/objectives/fetch-objectives-todo-user";
import { deleteTask } from "@/lib/tasks/delete-task";
import { deleteTaskRepeat } from "@/lib/tasks/delete-task-repeat";
import {
  normalizeCancellationReasonForApi,
  patchTaskStatus,
} from "@/lib/tasks/patch-task-status";
import { putTask } from "@/lib/tasks/put-task";
import { putTaskDate } from "@/lib/tasks/put-task-date";
import { toDateInputValue } from "@/lib/tasks/format-task-date-local";
import { isTaskDisplayRecurring } from "@/lib/tasks/task-display-recurring";
import { isTaskBlockedByObjectiveForEdit } from "@/lib/tasks/task-edit-policy";
import type { Objective, Tarefa, TarefaStatus, TarefaSubtarefa } from "@/lib/types/models";

const ease = [0.16, 1, 0.3, 1] as const;

const WEEK_DAYS = [
  { value: 0, label: "Dom" }, { value: 1, label: "Seg" },
  { value: 2, label: "Ter" }, { value: 3, label: "Qua" },
  { value: 4, label: "Qui" }, { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

const STATUS_OPTIONS: { value: TarefaStatus; label: string; color: string }[] = [
  { value: "PENDING",     label: "Pendente",      color: "text-brand-blue"         },
  { value: "IN_PROGRESS", label: "Em andamento",  color: "text-brand-cyan"         },
  { value: "DONE",        label: "Concluída",      color: "text-emerald-400"        },
  { value: "OVERDUE",     label: "Atrasada",       color: "text-brand-pink"         },
  { value: "CANCELLED",   label: "Cancelada",      color: "text-[var(--text-muted)]"},
];

const schema = z
  .object({
    nameTask: z.string().min(1, "Nome é obrigatório").max(100),
    descriptionTask: z.string().max(500).optional(),
    idObjective: z
      .union([z.string(), z.number()])
      .refine((v) => {
        if (typeof v === "number") return Number.isFinite(v) && v >= 1;
        const s = String(v).trim();
        return s.length > 0 && s !== "0";
      }, "Selecione um objetivo"),
    dateTask: z.string().min(1, "Data é obrigatória"),
    status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "OVERDUE", "CANCELLED"]),
    cancellationReason: z.string().optional(),
    isRecurring: z.boolean(),
    recurringDays: z.array(z.number()).optional(),
    recurringUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.recurringDays || data.recurringDays.length === 0)
        ctx.addIssue({ code: "custom", message: "Selecione ao menos um dia", path: ["recurringDays"] });
      if (!data.recurringUntil)
        ctx.addIssue({ code: "custom", message: "Informe a data final", path: ["recurringUntil"] });
    }
    if (data.status === "CANCELLED") {
      const segs = parseCancellationSegments(data.cancellationReason ?? "");
      if (segs.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Informe os motivos do cancelamento, separados por ;",
          path: ["cancellationReason"],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export type EditarTarefaModalProps = {
  open: boolean;
  task: Tarefa | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Tarefa) => void;
  /**
   * Objetivos permitidos (ex.: categoria compartilhada). `undefined` = todos em andamento via API (`/objectives/status/todo/user`).
   * Com valor definido: mesma lógica do modal de nova tarefa (API filtrada por estes IDs; colaborativa usa só esta lista local).
   */
  objectiveOptionsOverride?: Objective[];
  /** E-mail do usuário atual (excluir tarefa colaborativa só se for o autor). */
  viewerEmail?: string;
  /**
   * Após exclusão bem-sucedida na API. Opcional: sem ele a tarefa some no back mas a lista local pode ficar desatualizada até recarregar.
   * `seriesRemoved`: refetch recomendado (série recorrente).
   */
  onDeleted?: (taskId: number | string, meta?: { seriesRemoved?: boolean }) => void;
};

export function EditarTarefaModal({
  open,
  task,
  onOpenChange,
  onSaved,
  objectiveOptionsOverride,
  viewerEmail,
  onDeleted,
}: EditarTarefaModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [recurringDeleteOpen, setRecurringDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [topCancelReasons, setTopCancelReasons] = useState<{ reason: string; count: number }[]>([]);
  const [subtasksState, setSubtasksState] = useState<TarefaSubtarefa[]>([]);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subModalMode, setSubModalMode] = useState<"create" | "edit">("create");
  const [subModalEditing, setSubModalEditing] = useState<TarefaSubtarefa | null>(null);
  const subtasksSnapshotRef = useRef<string>("");

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isDirty } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        nameTask: "", descriptionTask: "", idObjective: "",
        dateTask: "", status: "PENDING", cancellationReason: "", isRecurring: false,
        recurringDays: [], recurringUntil: "",
      },
    });

  const isRecurring = watch("isRecurring");
  const recurringDays = watch("recurringDays") ?? [];
  const watchStatus = watch("status");
  const watchObjective = watch("idObjective");
  const hasObjectiveSelected =
    watchObjective != null &&
    ((typeof watchObjective === "number" && Number.isFinite(watchObjective) && watchObjective >= 1) ||
      (typeof watchObjective === "string" && watchObjective.trim().length > 0 && watchObjective.trim() !== "0"));
  const cancellationReasonVal = watch("cancellationReason") ?? "";
  const watchName = watch("nameTask");
  const watchDesc = watch("descriptionTask");
  const watchDate = watch("dateTask");

  const useFixedObjectives = objectiveOptionsOverride !== undefined;
  const useLocalSharedObjectives = Boolean(task?.sharedTask && useFixedObjectives);

  const mergeCurrentTaskObjective = (base: Objective[]): Objective[] => {
    if (!task) return base;
    const oid = task.idObjective;
    if (oid === "" || oid == null) return base;
    if (typeof oid === "number" && !Number.isFinite(oid)) return base;
    const sid = String(oid);
    if (base.some((o) => String(o.id) === sid)) return base;
    return [
      ...base,
      {
        id: oid,
        nameObjective: "Objetivo atual",
        descriptionObjective: "",
        statusObjective: "IN_PROGRESS",
      },
    ];
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    if (useFixedObjectives && useLocalSharedObjectives) {
      setObjectives(mergeCurrentTaskObjective(objectiveOptionsOverride ?? []));
      return;
    }

    const run = async () => {
      let jwt = "";
      try {
        jwt = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.token) ?? "" : "";
      } catch {
        /* ignore */
      }
      const token = jwt.trim();
      if (!token) {
        if (useFixedObjectives && !useLocalSharedObjectives) {
          setObjectives(mergeCurrentTaskObjective(objectiveOptionsOverride ?? []));
        } else {
          setObjectives(mergeCurrentTaskObjective([]));
        }
        return;
      }

      const result = await fetchObjectivesTodoUser(token);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Sessão expirada ou inválida. Faça login novamente.");
        setObjectives(mergeCurrentTaskObjective([]));
        return;
      }

      if (result.kind !== "ok") {
        if (useFixedObjectives && !useLocalSharedObjectives) {
          setObjectives(mergeCurrentTaskObjective(objectiveOptionsOverride ?? []));
        } else {
          setObjectives(mergeCurrentTaskObjective([]));
        }
        return;
      }

      let list = result.objectives;
      if (useFixedObjectives && !useLocalSharedObjectives) {
        const allowed = new Set((objectiveOptionsOverride ?? []).map((o) => String(o.id)));
        list = list.filter((o) => allowed.has(String(o.id)));
        if (list.length === 0 && (objectiveOptionsOverride?.length ?? 0) > 0) {
          list = (objectiveOptionsOverride ?? []).filter((o) => o.statusObjective === "IN_PROGRESS");
        }
      }
      setObjectives(mergeCurrentTaskObjective(list));
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    useFixedObjectives,
    useLocalSharedObjectives,
    objectiveOptionsOverride,
    router,
    task?.sharedTask,
    task?.idObjective,
  ]);

  useEffect(() => {
    if (!open) { setApiError(null); return; }
    if (!task) return;
    reset({
      nameTask: task.nameTask,
      descriptionTask: task.descriptionTask ?? "",
      idObjective: task.idObjective,
      dateTask: toDateInputValue(task.dateTask) || task.dateTask,
      status: task.status,
      cancellationReason: task.cancellationReason ?? "",
      isRecurring: isTaskDisplayRecurring(task),
      recurringDays: task.recurringDays ?? [],
      recurringUntil: toDateInputValue(task.recurringUntil ?? ""),
    });
    const migrated = migrateSubtasksFromParent(task.subtasks, task);
    setSubtasksState(migrated);
    subtasksSnapshotRef.current = JSON.stringify(migrated);
    setApiError(null);
  }, [open, task, reset]);

  const subtasksDirty = JSON.stringify(subtasksState) !== subtasksSnapshotRef.current;

  useEffect(() => {
    if (!open || watchStatus !== "CANCELLED" || !watchObjective) {
      setTopCancelReasons([]);
      return;
    }
    setTopCancelReasons(getTopCancellationReasons(watchObjective));
  }, [open, watchStatus, watchObjective]);

  const appendCancelReason = (r: string) => {
    const seg = r.trim();
    if (!seg) return;
    const t = cancellationReasonVal.trim();
    setValue("cancellationReason", t ? `${t}; ${seg}` : seg, { shouldDirty: true, shouldValidate: true });
  };

  const toggleDay = (day: number) => {
    const cur = recurringDays;
    setValue("recurringDays", cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day], { shouldDirty: true });
  };

  const googleAgendaUrl = buildGoogleCalendarEventEditUrl({
    text: watchName ?? "",
    details: watchDesc ?? "",
    date: watchDate ?? "",
  });

  const openGoogleAgenda = () => {
    if (!googleAgendaUrl) return;
    window.open(googleAgendaUrl, "_blank", "noopener,noreferrer");
  };

  const objectiveLabel =
    objectives.find((o) => String(o.id) === String(watchObjective))?.nameObjective ?? "Objetivo da tarefa pai";

  const openNewSubtask = () => {
    setSubModalMode("create");
    setSubModalEditing(null);
    setSubModalOpen(true);
  };

  const openEditSubtask = (s: TarefaSubtarefa) => {
    setSubModalMode("edit");
    setSubModalEditing(s);
    setSubModalOpen(true);
  };

  const handleSubSave = (s: TarefaSubtarefa) => {
    const oid = hasObjectiveSelected ? watchObjective : s.idObjective;
    const next = { ...s, idObjective: oid };
    if (subModalMode === "create") {
      setSubtasksState((prev) => [...prev, next]);
    } else {
      setSubtasksState((prev) => prev.map((x) => (x.id === next.id ? next : x)));
    }
  };

  const handleSubDelete = (id: string) => {
    setSubtasksState((prev) => prev.filter((x) => x.id !== id));
  };

  const onSubmit = async (data: FormValues) => {
    if (!task) return;
    if (isTaskBlockedByObjectiveForEdit(task)) return;
    setApiError(null);
    if (objectiveOptionsOverride !== undefined) {
      if (objectiveOptionsOverride.length === 0) {
        setApiError("Nenhum objetivo disponível para esta categoria.");
        return;
      }
      const allowed = new Set(objectiveOptionsOverride.map((o) => String(o.id)));
      if (!allowed.has(String(data.idObjective))) {
        setApiError("Escolha um objetivo desta categoria compartilhada.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const cancelRaw =
        data.status === "CANCELLED" ? (data.cancellationReason ?? "").trim() : undefined;
      const subtasksClean = stripEmptySubtasks(syncSubtasksObjective(subtasksState, data.idObjective));

      if (task.sharedTask) {
        const updated = updateCollaborativeTask(task.id, {
          nameTask: data.nameTask.trim(),
          descriptionTask: (data.descriptionTask ?? "").trim(),
          idObjective: data.idObjective,
          dateTask: data.dateTask,
          status: data.status,
          cancellationReason: data.status === "CANCELLED" ? cancelRaw : undefined,
          isRecurring: data.isRecurring,
          recurringDays: data.isRecurring ? data.recurringDays : [],
          recurringUntil: data.isRecurring ? data.recurringUntil : undefined,
          subtasks: subtasksClean.length > 0 ? subtasksClean : undefined,
        });
        if (!updated) {
          setApiError("Não foi possível salvar a tarefa colaborativa.");
          return;
        }
        if (data.status === "CANCELLED" && cancelRaw) {
          recordCancellationReasons(data.idObjective, cancelRaw);
        }
        onSaved(updated);
        onOpenChange(false);
        return;
      }

      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }
      if (!jwtToken) {
        setApiError("Faça login para salvar alterações.");
        return;
      }

      const rawObj = data.idObjective;
      const idObjectivePut =
        rawObj === "" || rawObj === 0
          ? null
          : typeof rawObj === "number"
            ? rawObj
            : String(rawObj).trim() || null;

      const putResult = await putTask(jwtToken, task.id, {
        nameTask: data.nameTask.trim(),
        descriptionTask: (data.descriptionTask ?? "").trim(),
        idObjective: idObjectivePut,
      });

      if (putResult.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }
      if (putResult.kind === "network_error") {
        setApiError("Falha de conexão. Verifique sua internet.");
        return;
      }
      if (putResult.kind === "http_error") {
        setApiError("Não foi possível salvar a tarefa. Tente novamente.");
        return;
      }

      let serverTask = putResult.kind === "ok" ? putResult.task : null;

      const nextDateYmd = toDateInputValue(data.dateTask);
      const prevDateYmd = toDateInputValue(task.dateTask);
      const dateChanged = nextDateYmd !== prevDateYmd;

      if (dateChanged) {
        const dateResult = await putTaskDate(jwtToken, task.id, data.dateTask);

        if (dateResult.kind === "unauthorized") {
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }
        if (dateResult.kind === "network_error") {
          setApiError("Falha de conexão ao atualizar a data.");
          return;
        }
        if (dateResult.kind === "http_error") {
          // TODO (UX): mapear 403/404/400/422 para mensagens específicas quando o contrato da API existir.
          setApiError("Não foi possível atualizar a data da tarefa. Tente novamente.");
          return;
        }
        // TODO (UX): se o back passar a retornar corpo em todo 200, preferir `dateResult.task` para `dateTask` e demais campos.
        if (dateResult.kind === "ok" && dateResult.task) {
          serverTask = serverTask ? { ...serverTask, ...dateResult.task } : dateResult.task;
        }
      }

      const cancelRawTrimmed = (cancelRaw ?? "").trim();
      const prevCancelNorm = normalizeCancellationReasonForApi(task.cancellationReason ?? "");
      const nextCancelNorm = normalizeCancellationReasonForApi(cancelRaw ?? "");
      const statusChanged = data.status !== task.status;
      const cancelDetailsChanged =
        data.status === "CANCELLED" &&
        task.status === "CANCELLED" &&
        nextCancelNorm !== prevCancelNorm;

      let statusPatchTask: Tarefa | undefined;
      if (statusChanged || cancelDetailsChanged) {
        const patchRes = await patchTaskStatus(
          jwtToken,
          task.id,
          data.status,
          data.status === "CANCELLED" ? cancelRawTrimmed : undefined
        );

        if (patchRes.kind === "unauthorized") {
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }
        if (patchRes.kind === "invalid_cancellation") {
          setApiError("Informe os motivos do cancelamento, separados por ;");
          return;
        }
        if (patchRes.kind === "network_error") {
          setApiError("Falha de conexão ao atualizar o status.");
          return;
        }
        if (patchRes.kind !== "ok" && patchRes.kind !== "ok_no_body") {
          setApiError("Não foi possível atualizar o status. Os demais dados podem ter sido salvos.");
          return;
        }
        if (patchRes.kind === "ok" && patchRes.task) {
          statusPatchTask = patchRes.task;
        }
      }

      if (data.status === "CANCELLED" && cancelRaw) {
        recordCancellationReasons(data.idObjective, cancelRaw);
      }

      onSaved({
        ...task,
        ...(serverTask ?? {}),
        ...(statusPatchTask ?? {}),
        nameTask: data.nameTask.trim(),
        descriptionTask: (data.descriptionTask ?? "").trim(),
        idObjective: data.idObjective,
        dateTask: data.dateTask,
        status: data.status,
        cancellationReason: data.status === "CANCELLED" ? cancelRaw : undefined,
        isRecurring: data.isRecurring,
        recurringDays: data.isRecurring ? (data.recurringDays ?? []) : [],
        recurringUntil: data.isRecurring ? data.recurringUntil : undefined,
        subtasks: subtasksClean.length > 0 ? subtasksClean : undefined,
      });
      onOpenChange(false);
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setSubmitting(false);
    }
  };

  const canDeleteCollaborative =
    Boolean(
      task?.sharedTask &&
        viewerEmail &&
        task.sharedTask.createdByEmail === viewerEmail.trim().toLowerCase()
    );

  /** Tarefas da API (não colaborativas): sempre oferecer exclusão; `onDeleted` só sincroniza a lista do pai. */
  const canDeleteApi = Boolean(task && !task.sharedTask);

  const handleDeleteCollaborative = () => {
    if (!task?.sharedTask || !viewerEmail) return;
    if (!window.confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    const r = deleteCollaborativeTask(task.id, viewerEmail);
    if (!r.ok) {
      setApiError(r.message);
      return;
    }
    onDeleted?.(task.id);
    onOpenChange(false);
  };

  const runApiDelete = async (mode: "single" | "series") => {
    if (!task) return;
    if (mode === "series") {
      if (
        !window.confirm(
          "Remover todas as repetições desta tarefa recorrente? Esta ação não pode ser desfeita."
        )
      ) {
        return;
      }
    }

    let jwtToken = "";
    try {
      jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }
    if (!jwtToken) {
      setApiError("Faça login para excluir tarefas.");
      return;
    }

    setDeleteSubmitting(true);
    setApiError(null);
    setRecurringDeleteOpen(false);

    try {
      const result =
        mode === "series"
          ? await deleteTaskRepeat(jwtToken, task.id, task.dateTask)
          : await deleteTask(jwtToken, task.id);

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }
      if (result.kind === "network_error") {
        setApiError("Falha de conexão. Verifique sua internet.");
        return;
      }
      if (result.kind === "http_error") {
        setApiError("Não foi possível excluir a tarefa. Tente novamente.");
        return;
      }

      onDeleted?.(task.id, { seriesRemoved: mode === "series" });
      onOpenChange(false);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!task) return;
    if (task.sharedTask && canDeleteCollaborative) {
      handleDeleteCollaborative();
      return;
    }
    if (canDeleteApi) {
      if (isTaskDisplayRecurring(task)) {
        setRecurringDeleteOpen(true);
      } else {
        if (!window.confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
        void runApiDelete("single");
      }
    }
  };

  useEffect(() => {
    if (!open) {
      setSubModalOpen(false);
      setRecurringDeleteOpen(false);
      setDeleteSubmitting(false);
    }
  }, [open]);

  if (!task) return null;

  const blockedReadOnly = isTaskBlockedByObjectiveForEdit(task);

  return (
    <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(
          "fixed inset-0 z-[60] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
          "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
        )} />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 outline-none"
          aria-describedby="edit-tarefa-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-[min(100%,72rem)] overflow-x-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-lg font-extrabold text-[var(--text-primary)]">Editar tarefa</Dialog.Title>
                  <p id="edit-tarefa-desc" className="mt-0.5 text-xs text-[var(--text-muted)] font-mono">{task.uuid}</p>
                  {(canDeleteCollaborative || canDeleteApi) && (
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-pink underline-offset-4 transition-colors hover:text-brand-pink/90 hover:underline disabled:pointer-events-none disabled:opacity-50"
                      disabled={blockedReadOnly || deleteSubmitting}
                      onClick={handleDeleteClick}
                    >
                      <TrashIcon className="h-4 w-4 shrink-0" aria-hidden />
                      {deleteSubmitting ? "Excluindo…" : "Excluir tarefa"}
                    </button>
                  )}
                </div>
                <Dialog.Close type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Fechar">
                  <XMarkIcon className="h-6 w-6" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                {apiError && (
                  <p className="rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink" role="alert">{apiError}</p>
                )}

                {task.sharedTask && (
                  <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/[0.08] px-3 py-2 text-xs text-[var(--text-muted)]">
                    <span className="font-semibold text-brand-cyan">Categoria compartilhada</span>
                    {" · "}
                    Criada por{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {task.sharedTask.createdByName?.trim() || task.sharedTask.createdByEmail}
                    </span>
                  </div>
                )}

                {blockedReadOnly && (
                  <p className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-muted)]">
                    Objetivo concluído: esta tarefa está bloqueada e não pode ser editada.
                  </p>
                )}

                {/* Nome */}
                <div>
                  <label htmlFor="et-name" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Nome <span className="text-brand-pink" aria-hidden>*</span></label>
                  <Input id="et-name" placeholder="Ex.: Estudar módulo IAM" disabled={blockedReadOnly} {...register("nameTask")} />
                  {errors.nameTask && <p className="mt-1 text-sm text-brand-pink">{errors.nameTask.message}</p>}
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="et-desc" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Descrição <span className="text-xs text-[var(--text-muted)]">(opcional)</span></label>
                  <textarea id="et-desc" rows={3} placeholder="Detalhes sobre a tarefa…"
                    className={cn(
                      "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                      "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                      "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
                      "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
                    )}
                    disabled={blockedReadOnly}
                    {...register("descriptionTask")} />
                </div>

                {/* Objetivo */}
                <div>
                  <label htmlFor="et-obj" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Objetivo <span className="text-brand-pink" aria-hidden>*</span></label>
                  <GlassSelect id="et-obj" disabled={blockedReadOnly} {...register("idObjective")}>
                    <option value="">Selecione um objetivo…</option>
                    {objectives.map((o) => (
                      <option key={String(o.id)} value={String(o.id)}>{o.nameObjective}</option>
                    ))}
                  </GlassSelect>
                  {errors.idObjective && <p className="mt-1 text-sm text-brand-pink">{errors.idObjective.message}</p>}
                </div>

                {/* Data + Status (lado a lado) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="et-date" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Data <span className="text-brand-pink" aria-hidden>*</span></label>
                    <DateField id="et-date" disabled={blockedReadOnly} {...register("dateTask")} />
                    {errors.dateTask && <p className="mt-1 text-sm text-brand-pink">{errors.dateTask.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="et-status" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Status</label>
                    <GlassSelect id="et-status" disabled={blockedReadOnly} {...register("status")}>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </GlassSelect>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-cyan/25 bg-brand-cyan/[0.06] p-4">
                  <DevSectionNotice
                    className="mb-3 border-brand-cyan/30 bg-brand-cyan/[0.1]"
                    message="Subtarefas e o quadro neste modal ainda estão em evolução; o comportamento e a sincronização podem mudar com a integração ao servidor."
                  />
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Subtarefas</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Mesmo formato das tarefas simples; objetivo sempre o da tarefa pai (
                        <span className="font-medium text-brand-cyan">{objectiveLabel}</span>
                        ). Quadro sem filtro por objetivo. Só é possível criar subtarefas aqui, após a tarefa existir.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto"
                      disabled={blockedReadOnly || !hasObjectiveSelected}
                      onClick={openNewSubtask}
                    >
                      <PlusCircleIcon className="h-5 w-5" aria-hidden />
                      Nova subtarefa
                    </Button>
                  </div>
                  <SubtarefasKanbanBoard
                    subtasks={subtasksState}
                    onSubtasksChange={blockedReadOnly ? () => {} : setSubtasksState}
                    onEditSubtask={blockedReadOnly ? () => {} : openEditSubtask}
                  />
                </div>

                <div className="rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_70%,transparent)] px-4 py-3">
                  <p className="mb-2 text-xs text-[var(--text-muted)]">
                    Abre o Google Agenda com título, descrição e data deste formulário (mesmo antes de salvar).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={!googleAgendaUrl}
                    onClick={openGoogleAgenda}
                  >
                    <CalendarDaysIcon className="h-5 w-5" aria-hidden />
                    Adicionar ao Google Agenda
                  </Button>
                </div>

                {watchStatus === "CANCELLED" && (
                  <div className="rounded-xl border border-brand-pink/30 bg-brand-pink/5 p-4">
                    <label htmlFor="et-cancel-reasons" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      Motivos do cancelamento <span className="text-brand-pink">*</span>
                    </label>
                    <p className="mb-2 text-xs text-[var(--text-muted)]">
                      Separe os motivos por <span className="font-mono text-brand-cyan">;</span> (ex.: Imprevisto; Trabalho; Amway)
                    </p>
                    <textarea
                      id="et-cancel-reasons"
                      rows={3}
                      placeholder="Imprevisto; Trabalho; Amway"
                      className={cn(
                        "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                        "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                        "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.2)] focus:outline-none"
                      )}
                      disabled={blockedReadOnly}
                      {...register("cancellationReason")}
                    />
                    {errors.cancellationReason && (
                      <p className="mt-1 text-sm text-brand-pink">{errors.cancellationReason.message}</p>
                    )}
                    {topCancelReasons.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Mais usados neste objetivo
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {topCancelReasons.map(({ reason, count }) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => appendCancelReason(reason)}
                              className={cn(
                                "inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[var(--glass-border)]",
                                "px-2.5 py-1.5 text-left text-xs font-medium text-[var(--text-primary)]",
                                "transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/10"
                              )}
                              title={`Usado ${count} vez(es)`}
                            >
                              <span className="truncate">{reason}</span>
                              <span className="shrink-0 rounded-md bg-[var(--glass-border)] px-1 py-0.5 text-[10px] text-[var(--text-muted)]">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Controller
                  control={control}
                  name="isRecurring"
                  render={({ field }) => (
                    <RecurringTaskSwitch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={blockedReadOnly}
                    />
                  )}
                />

                {isRecurring && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.28, ease }} className="overflow-hidden">
                    <div className="flex flex-col gap-4 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Repete nos dias</p>
                        <div className="flex flex-wrap gap-2">
                          {WEEK_DAYS.map(d => (
                            <button
                              key={d.value}
                              type="button"
                              disabled={blockedReadOnly}
                              onClick={() => toggleDay(d.value)}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                                recurringDays.includes(d.value)
                                  ? "bg-brand-cyan text-white shadow-glow"
                                  : "border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-brand-cyan/40",
                                blockedReadOnly && "pointer-events-none opacity-50"
                              )}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        {errors.recurringDays && <p className="mt-1 text-sm text-brand-pink">{errors.recurringDays.message}</p>}
                      </div>
                      <div>
                        <label htmlFor="et-until" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-cyan">Repetir até</label>
                        <DateField id="et-until" disabled={blockedReadOnly} {...register("recurringUntil")} />
                        {errors.recurringUntil && <p className="mt-1 text-sm text-brand-pink">{errors.recurringUntil.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--glass-border)] pt-4">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="min-w-[6.5rem] flex-1 sm:flex-none">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    className="min-w-[6.5rem] flex-1 sm:flex-none"
                    disabled={
                      submitting ||
                      deleteSubmitting ||
                      blockedReadOnly ||
                      (!isDirty && !subtasksDirty)
                    }
                  >
                    {submitting ? "Salvando…" : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <Dialog.Root open={recurringDeleteOpen} onOpenChange={setRecurringDeleteOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[70] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[71] w-[min(100%,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--glass-border)]",
            "bg-[var(--glass-bg)] p-5 shadow-glass-lg outline-none backdrop-blur-glass"
          )}
          aria-describedby="recurring-delete-desc"
        >
          <Dialog.Title className="text-base font-bold text-[var(--text-primary)]">
            Excluir tarefa recorrente
          </Dialog.Title>
          <p id="recurring-delete-desc" className="mt-2 text-sm text-[var(--text-muted)]">
            Esta tarefa faz parte de uma recorrência. O que deseja remover?
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/10"
              disabled={deleteSubmitting}
              onClick={() => void runApiDelete("single")}
            >
              Só esta ocorrência
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center border-brand-pink/50 text-brand-pink hover:bg-brand-pink/10"
              disabled={deleteSubmitting}
              onClick={() => void runApiDelete("series")}
            >
              Todas as repetições
            </Button>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" className="w-full" disabled={deleteSubmitting}>
                Cancelar
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <EditarSubtarefaModal
      open={subModalOpen}
      onOpenChange={setSubModalOpen}
      mode={subModalMode}
      subtask={subModalEditing}
      defaultDateTask={watchDate || task.dateTask}
      idObjective={hasObjectiveSelected ? watchObjective : task.idObjective}
      objectiveName={objectiveLabel}
      onSave={handleSubSave}
      onDelete={subModalMode === "edit" ? handleSubDelete : undefined}
    />
    </>
  );
}
