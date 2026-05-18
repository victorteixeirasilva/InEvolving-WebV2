"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { TaskIdCopyRow } from "@/components/features/tarefas/TaskIdCopyRow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { DateField } from "@/components/ui/DateField";
import { STORAGE_KEYS } from "@/lib/constants";
import { createSubtaskId } from "@/lib/subtarefas";
import { fetchTaskResponsible } from "@/lib/tasks/fetch-task-responsible";
import { putTaskResponsible } from "@/lib/tasks/put-task-responsible";
import {
  idResponsibleUserForChoice,
  isApiTaskUuid,
  isExplicitResponsibleAssignment,
  normalizeUserId,
  responsibleChoiceFromState,
  type ResponsibleChoice,
} from "@/lib/tasks/task-responsible";
import type { Tarefa, TarefaSubtarefa, TarefaStatus } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_OPTIONS: { value: TarefaStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "DONE", label: "Concluída" },
  { value: "OVERDUE", label: "Atrasada" },
  { value: "CANCELLED", label: "Cancelada" },
];

export type EditarSubtarefaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  subtask: TarefaSubtarefa | null;
  defaultDateTask: string;
  idObjective: number | string;
  objectiveName: string;
  onSave: (s: TarefaSubtarefa) => void;
  onDelete?: (id: string) => void;
  enableResponsibleApi?: boolean;
  viewerUserId?: string | null;
  parentTask?: Tarefa | null;
};

export function EditarSubtarefaModal({
  open,
  onOpenChange,
  mode,
  subtask,
  defaultDateTask,
  idObjective,
  objectiveName,
  onSave,
  onDelete,
  enableResponsibleApi = false,
  viewerUserId = null,
  parentTask = null,
}: EditarSubtarefaModalProps) {
  const [nameTask, setNameTask] = useState("");
  const [descriptionTask, setDescriptionTask] = useState("");
  const [dateTask, setDateTask] = useState(defaultDateTask);
  const [status, setStatus] = useState<TarefaStatus>("PENDING");
  const [subId, setSubId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [idResponsibleUser, setIdResponsibleUser] = useState<string | null | undefined>(undefined);
  const [responsibleChoice, setResponsibleChoice] = useState<ResponsibleChoice>("creator");
  const [responsibleLoading, setResponsibleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const responsibleSnapshotRef = useRef<string | null | undefined>(undefined);

  const showResponsible =
    enableResponsibleApi && mode === "edit" && subtask && isApiTaskUuid(subtask.id);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && subtask) {
      setSubId(subtask.id);
      setNameTask(subtask.nameTask);
      setDescriptionTask(subtask.descriptionTask ?? "");
      setDateTask(subtask.dateTask);
      setStatus(subtask.status);
      setIdResponsibleUser(subtask.idResponsibleUser);
      responsibleSnapshotRef.current = subtask.idResponsibleUser;
      setResponsibleChoice(responsibleChoiceFromState(subtask.idResponsibleUser, viewerUserId));
    } else {
      setSubId(createSubtaskId());
      setNameTask("");
      setDescriptionTask("");
      setDateTask(defaultDateTask);
      setStatus("PENDING");
      setIdResponsibleUser(undefined);
      responsibleSnapshotRef.current = undefined;
      setResponsibleChoice("creator");
    }
  }, [open, mode, subtask, defaultDateTask, viewerUserId]);

  useEffect(() => {
    if (!open || !showResponsible || !subtask) return;
    let cancelled = false;
    setResponsibleLoading(true);

    void (async () => {
      let jwt = "";
      try {
        jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }
      if (!jwt) {
        if (!cancelled) setResponsibleLoading(false);
        return;
      }
      const r = await fetchTaskResponsible(jwt, subtask.id);
      if (!cancelled && r.kind === "ok") {
        setIdResponsibleUser(r.data.idResponsibleUser);
        responsibleSnapshotRef.current = r.data.idResponsibleUser;
        setResponsibleChoice(responsibleChoiceFromState(r.data.idResponsibleUser, viewerUserId));
      }
      if (!cancelled) setResponsibleLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, showResponsible, subtask, viewerUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTask.trim()) {
      setError("Informe o nome da subtarefa.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTask)) {
      setError("Data inválida.");
      return;
    }

    const payload: TarefaSubtarefa = {
      id: subId,
      nameTask: nameTask.trim(),
      descriptionTask: descriptionTask.trim(),
      dateTask,
      status,
      idObjective,
      idUser: subtask?.idUser ?? parentTask?.idUser,
      idResponsibleUser,
    };

    if (showResponsible) {
      setSubmitting(true);
      try {
        let jwt = "";
        try {
          jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
        } catch {
          /* ignore */
        }
        const nextResponsible = idResponsibleUserForChoice(responsibleChoice, viewerUserId);
        const changed =
          normalizeUserId(nextResponsible) !== normalizeUserId(responsibleSnapshotRef.current ?? null);

        if (jwt && changed) {
          const put = await putTaskResponsible(jwt, {
            idTask: subId,
            idResponsibleUser: nextResponsible,
          });
          if (put.kind === "ok") {
            payload.idResponsibleUser = put.data.idResponsibleUser;
          } else {
            setError("Não foi possível atualizar o responsável da subtarefa.");
            return;
          }
        }

        onSave(payload);
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    onSave(payload);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!subtask || !onDelete) return;
    if (typeof window !== "undefined" && !window.confirm("Remover esta subtarefa?")) return;
    onDelete(subtask.id);
    onOpenChange(false);
  };

  const creatorId = normalizeUserId(subtask?.idUser ?? parentTask?.idUser);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[65] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[65] flex max-h-dvh items-center justify-center overflow-y-auto p-3 outline-none sm:p-6"
          aria-describedby="subtarefa-form-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className={cn(
              "relative w-full max-w-[min(100%,26rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] p-6 shadow-glass-lg backdrop-blur-glass"
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">
                  {mode === "create" ? "Nova subtarefa" : "Editar subtarefa"}
                </Dialog.Title>
                {mode === "edit" && <TaskIdCopyRow taskId={subId} className="mt-1" />}
              </div>
              <Dialog.Close
                type="button"
                className="rounded-xl p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-6 w-6" />
              </Dialog.Close>
            </div>
            <p id="subtarefa-form-desc" className="text-sm text-[var(--text-muted)]">
              Objetivo (mesmo da tarefa pai): <span className="font-semibold text-brand-cyan">{objectiveName}</span>
            </p>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="sub-name" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Nome <span className="text-brand-pink">*</span>
                </label>
                <Input id="sub-name" value={nameTask} onChange={(e) => setNameTask(e.target.value)} className="py-2.5" />
              </div>
              <div>
                <label htmlFor="sub-desc" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Descrição
                </label>
                <textarea
                  id="sub-desc"
                  rows={3}
                  value={descriptionTask}
                  onChange={(e) => setDescriptionTask(e.target.value)}
                  className={cn(
                    "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5",
                    "text-sm text-[var(--text-primary)] focus:border-brand-cyan focus:outline-none focus:ring-2 focus:ring-brand-cyan/25"
                  )}
                />
              </div>
              {showResponsible && (
                <div>
                  <label htmlFor="sub-responsible" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                    Responsável
                  </label>
                  {responsibleLoading ? (
                    <p className="text-xs text-[var(--text-muted)]">Carregando responsável…</p>
                  ) : viewerUserId &&
                    creatorId === viewerUserId &&
                    !isExplicitResponsibleAssignment(idResponsibleUser) ? (
                    <p className="text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-primary)]">Você</span> (criador)
                    </p>
                  ) : (
                    <GlassSelect
                      id="sub-responsible"
                      value={responsibleChoice}
                      onChange={(e) => setResponsibleChoice(e.target.value as ResponsibleChoice)}
                    >
                      <option value="creator">Criador da subtarefa (padrão)</option>
                      {viewerUserId ? <option value="self">Eu</option> : null}
                    </GlassSelect>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="sub-date" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                    Data
                  </label>
                  <DateField id="sub-date" value={dateTask} onChange={(e) => setDateTask(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="sub-status" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                    Status
                  </label>
                  <GlassSelect id="sub-status" value={status} onChange={(e) => setStatus(e.target.value as TarefaStatus)}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </GlassSelect>
                </div>
              </div>
              {error && <p className="text-sm text-brand-pink">{error}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:justify-between">
                {mode === "edit" && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    onClick={handleDelete}
                  >
                    Excluir
                  </Button>
                ) : (
                  <span className="hidden sm:block sm:flex-1" />
                )}
                <div className="flex gap-2 sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}