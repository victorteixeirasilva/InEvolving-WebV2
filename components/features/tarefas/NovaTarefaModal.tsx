"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { formatDateEnCA } from "@/lib/tasks/format-task-date-local";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { DateField } from "@/components/ui/DateField";
import { RecurringTaskSwitch } from "@/components/ui/RecurringTaskSwitch";
import {
  addCollaborativeTask,
  type SharedTaskCollaborationMeta,
} from "@/lib/shared-category-tasks-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchObjectivesTodoUser } from "@/lib/objectives/fetch-objectives-todo-user";
import { postTask } from "@/lib/tasks/post-task";
import { postTaskRepeat, recurringDaysToWeekdayFlags } from "@/lib/tasks/post-task-repeat";
import type { Objective, Tarefa } from "@/lib/types/models";

const ease = [0.16, 1, 0.3, 1] as const;

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

const schema = z
  .object({
    nameTask: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
    descriptionTask: z.string().max(500, "Máximo 500 caracteres").optional(),
    idObjective: z
      .union([z.string(), z.number()])
      .refine((v) => {
        if (typeof v === "number") return Number.isFinite(v) && v >= 1;
        const s = String(v).trim();
        return s.length > 0 && s !== "0";
      }, "Selecione um objetivo"),
    dateTask: z.string().min(1, "Data é obrigatória"),
    isRecurring: z.boolean(),
    recurringDays: z.array(z.number()).optional(),
    recurringUntil: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      if (!data.recurringDays || data.recurringDays.length === 0) {
        ctx.addIssue({ code: "custom", message: "Selecione ao menos um dia", path: ["recurringDays"] });
      }
      if (!data.recurringUntil) {
        ctx.addIssue({ code: "custom", message: "Informe a data final", path: ["recurringUntil"] });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

export type NovaTarefaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (task: Tarefa) => void;
  /**
   * Quando definido, o select mostra só objetivos em andamento da API que pertencem a estes IDs
   * (exceto fluxo colaborativo, que usa esta lista local). Se omitido, lista todos em andamento da API.
   */
  objectivesForSelect?: Objective[] | null;
  /** Texto extra abaixo do título (ex.: nome da categoria compartilhada). */
  contextSubtitle?: string | null;
  /** Convidado: cria só no armazenamento colaborativo (sem POST do mock). */
  createCollaborativeOnly?: boolean;
  collaborationMeta?: SharedTaskCollaborationMeta | null;
};

export function NovaTarefaModal({
  open,
  onOpenChange,
  onCreated,
  objectivesForSelect,
  contextSubtitle,
  createCollaborativeOnly,
  collaborationMeta,
}: NovaTarefaModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameTask: "",
      descriptionTask: "",
      idObjective: "",
      dateTask: formatDateEnCA(new Date()),
      isRecurring: false,
      recurringDays: [],
      recurringUntil: "",
    },
  });

  const isRecurring = watch("isRecurring");
  const recurringDays = watch("recurringDays") ?? [];

  /** `null`/`undefined` = todos em andamento (API); array = filtrar API por estes IDs (ou lista local no colaborativo). */
  const useFixedObjectives = objectivesForSelect != null;
  const useLocalSharedObjectives = Boolean(createCollaborativeOnly && collaborationMeta);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    if (useFixedObjectives && useLocalSharedObjectives) {
      setObjectives(objectivesForSelect ?? []);
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
          setObjectives(objectivesForSelect ?? []);
        } else {
          setObjectives([]);
        }
        return;
      }

      const result = await fetchObjectivesTodoUser(token);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Sessão expirada ou inválida. Faça login novamente.");
        setObjectives([]);
        return;
      }

      if (result.kind !== "ok") {
        if (useFixedObjectives && !useLocalSharedObjectives) {
          setObjectives(objectivesForSelect ?? []);
        } else {
          setObjectives([]);
        }
        return;
      }

      let list = result.objectives;
      if (useFixedObjectives && !useLocalSharedObjectives) {
        const allowed = new Set((objectivesForSelect ?? []).map((o) => String(o.id)));
        list = list.filter((o) => allowed.has(String(o.id)));
        // Se os IDs do dashboard e do endpoint todo não batem (ou lista do pai veio só de fallback),
        // ainda mostramos objetivos em andamento já conhecidos pelo pai.
        if (list.length === 0 && (objectivesForSelect?.length ?? 0) > 0) {
          list = (objectivesForSelect ?? []).filter((o) => o.statusObjective === "IN_PROGRESS");
        }
      }
      setObjectives(list);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    useFixedObjectives,
    useLocalSharedObjectives,
    objectivesForSelect,
    router,
  ]);

  useEffect(() => {
    if (!open) {
      setApiError(null);
      return;
    }
    const list = objectivesForSelect ?? [];
    const firstRaw = useFixedObjectives ? list[0]?.id : undefined;
    let firstObj: string | number = "";
    if (typeof firstRaw === "number" && Number.isFinite(firstRaw) && firstRaw >= 1) firstObj = firstRaw;
    else if (typeof firstRaw === "string" && firstRaw.trim()) firstObj = firstRaw.trim();
    reset({
      nameTask: "",
      descriptionTask: "",
      idObjective: useFixedObjectives && list.length === 1 ? firstObj : "",
      dateTask: formatDateEnCA(new Date()),
      isRecurring: false,
      recurringDays: [],
      recurringUntil: "",
    });
    setApiError(null);
  }, [open, reset, useFixedObjectives, objectivesForSelect]);

  /** Após carregar objetivos da API, alinhar pré-seleção quando havia um único ID permitido. */
  useEffect(() => {
    if (!open) return;
    const list = objectivesForSelect ?? [];
    if (!useFixedObjectives || list.length !== 1 || useLocalSharedObjectives) return;
    if (objectives.length === 0) {
      setValue("idObjective", "", { shouldValidate: false });
    } else if (objectives.length === 1) {
      setValue("idObjective", String(objectives[0].id), { shouldValidate: false });
    }
  }, [
    open,
    useFixedObjectives,
    useLocalSharedObjectives,
    objectivesForSelect,
    objectives,
    setValue,
  ]);

  const toggleDay = (day: number) => {
    const cur = recurringDays;
    setValue(
      "recurringDays",
      cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day],
      { shouldDirty: true }
    );
  };

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    if (useFixedObjectives) {
      const list = objectivesForSelect ?? [];
      if (list.length === 0) {
        setApiError("Não há objetivos disponíveis neste contexto.");
        return;
      }
      const allowed = new Set(list.map((o) => String(o.id)));
      if (!allowed.has(String(data.idObjective))) {
        setApiError("Selecione um objetivo desta categoria.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (createCollaborativeOnly && collaborationMeta) {
        const created = addCollaborativeTask({
          task: {
            nameTask: data.nameTask.trim(),
            descriptionTask: (data.descriptionTask ?? "").trim(),
            status: "PENDING",
            dateTask: data.dateTask,
            idObjective: data.idObjective,
            isRecurring: data.isRecurring,
            recurringDays: data.isRecurring ? data.recurringDays : [],
            recurringUntil: data.isRecurring ? data.recurringUntil : undefined,
          },
          collaboration: collaborationMeta,
        });
        onCreated(created);
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
        setApiError("Faça login para criar tarefas.");
        return;
      }

      const rawObj = data.idObjective;
      const idObjective =
        rawObj === "" || rawObj === 0
          ? null
          : typeof rawObj === "number"
            ? rawObj
            : String(rawObj).trim() || null;

      const createdResult = await postTask(jwtToken, {
        nameTask: data.nameTask.trim(),
        descriptionTask: (data.descriptionTask ?? "").trim(),
        dateTask: data.dateTask,
        idObjective,
      });

      if (createdResult.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }
      if (createdResult.kind === "network_error") {
        setApiError("Falha de conexão. Verifique sua internet.");
        return;
      }
      if (createdResult.kind === "invalid_response") {
        setApiError("Resposta inesperada do servidor ao criar a tarefa.");
        return;
      }
      if (createdResult.kind === "http_error") {
        setApiError("Não foi possível criar a tarefa. Tente novamente.");
        return;
      }

      let taskForUi: Tarefa = createdResult.task;

      if (data.isRecurring && data.recurringUntil) {
        const weekdays = recurringDaysToWeekdayFlags(data.recurringDays ?? []);
        const repeatResult = await postTaskRepeat(
          jwtToken,
          taskForUi.id,
          taskForUi.dateTask,
          data.recurringUntil,
          weekdays
        );
        if (repeatResult.kind === "unauthorized") {
          onCreated(taskForUi);
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          onOpenChange(false);
          return;
        }
        if (repeatResult.kind !== "ok") {
          setApiError(
            "Tarefa criada, mas não foi possível configurar a recorrência. Você pode tentar editar a tarefa depois."
          );
          onCreated(taskForUi);
          onOpenChange(false);
          return;
        }
        taskForUi = repeatResult.task
          ? {
              ...repeatResult.task,
              isRecurring: true,
              recurringDays: data.recurringDays,
              recurringUntil: data.recurringUntil,
            }
          : {
              ...taskForUi,
              isRecurring: true,
              recurringDays: data.recurringDays,
              recurringUntil: data.recurringUntil,
            };
      }

      onCreated(taskForUi);
      onOpenChange(false);
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 outline-none"
          aria-describedby="nova-tarefa-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-[min(100%,32rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />

            <div className="p-6">
              {/* header */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-extrabold text-[var(--text-primary)]">
                    Nova tarefa
                  </Dialog.Title>
                  <p id="nova-tarefa-desc" className="mt-0.5 text-sm text-[var(--text-muted)]">
                    {contextSubtitle
                      ? contextSubtitle
                      : "Preencha os dados da tarefa e vincule a um objetivo."}
                  </p>
                </div>
                <Dialog.Close
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                {apiError && (
                  <p className="rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink" role="alert">
                    {apiError}
                  </p>
                )}

                {/* Nome */}
                <div>
                  <label htmlFor="t-name" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Nome <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <Input id="t-name" placeholder="Ex.: Estudar módulo IAM" {...register("nameTask")} />
                  {errors.nameTask && <p className="mt-1 text-sm text-brand-pink">{errors.nameTask.message}</p>}
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="t-desc" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Descrição <span className="text-xs text-[var(--text-muted)]">(opcional)</span>
                  </label>
                  <textarea
                    id="t-desc"
                    rows={3}
                    placeholder="Detalhes sobre a tarefa…"
                    className={cn(
                      "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                      "text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                      "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
                      "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
                    )}
                    {...register("descriptionTask")}
                  />
                </div>

                {/* Objetivo */}
                <div>
                  <label htmlFor="t-obj" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Objetivo <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <GlassSelect
                    id="t-obj"
                    {...register("idObjective")}
                    disabled={useFixedObjectives && objectives.length === 0}
                  >
                    <option value="">
                      {useFixedObjectives && objectives.length === 0
                        ? "Nenhum objetivo nas suas categorias próprias"
                        : "Selecione um objetivo…"}
                    </option>
                    {objectives.map((o) => (
                      <option key={String(o.id)} value={String(o.id)}>
                        {o.nameObjective}
                      </option>
                    ))}
                  </GlassSelect>
                  {errors.idObjective && <p className="mt-1 text-sm text-brand-pink">{errors.idObjective.message}</p>}
                </div>

                {/* Data */}
                <div>
                  <label htmlFor="t-date" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Data <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <DateField id="t-date" {...register("dateTask")} />
                  {errors.dateTask && <p className="mt-1 text-sm text-brand-pink">{errors.dateTask.message}</p>}
                </div>

                <Controller
                  control={control}
                  name="isRecurring"
                  render={({ field }) => (
                    <RecurringTaskSwitch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />

                {/* Dias da semana + data fim */}
                {isRecurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease }}
                    className="flex flex-col gap-4 overflow-hidden rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4"
                  >
                    {/* Dias */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-cyan">
                        Repete nos dias
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDay(d.value)}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                              recurringDays.includes(d.value)
                                ? "bg-brand-cyan text-white shadow-glow"
                                : "border border-[var(--glass-border)] text-[var(--text-muted)] hover:border-brand-cyan/40"
                            )}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                      {errors.recurringDays && (
                        <p className="mt-1 text-sm text-brand-pink">{errors.recurringDays.message}</p>
                      )}
                    </div>

                    {/* Até quando */}
                    <div>
                      <label htmlFor="t-until" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-cyan">
                        Repetir até
                      </label>
                      <DateField id="t-until" {...register("recurringUntil")} />
                      {errors.recurringUntil && (
                        <p className="mt-1 text-sm text-brand-pink">{errors.recurringUntil.message}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Rodapé */}
                <div className="flex gap-2 border-t border-[var(--glass-border)] pt-4 sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none">Cancelar</Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none"
                    disabled={
                      submitting ||
                      !isDirty ||
                      (useFixedObjectives && objectives.length === 0)
                    }
                  >
                    {submitting ? "Criando…" : "Criar tarefa"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
