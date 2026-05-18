"use client";

import {
  getEffectiveResponsibleId,
  getResponsibleDisplayLabel,
  normalizeUserId,
  type ResponsibleEntity,
} from "@/lib/tasks/task-responsible";
import type { Tarefa } from "@/lib/types/models";

export type TaskResponsibleLineProps = {
  entity: ResponsibleEntity & { idUser?: number | string };
  sharedTask?: Tarefa["sharedTask"];
  viewerUserId: string | null;
  className?: string;
};

export function TaskResponsibleLine({
  entity,
  sharedTask,
  viewerUserId,
  className,
}: TaskResponsibleLineProps) {
  if (sharedTask) return null;

  const creatorId = normalizeUserId(entity.idUser);
  const effectiveId = getEffectiveResponsibleId(entity);
  if (!effectiveId) return null;

  const label = getResponsibleDisplayLabel(effectiveId, creatorId, viewerUserId);

  return (
    <p className={className ?? "text-[10px] text-[var(--text-muted)]"}>
      Responsável:{" "}
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
    </p>
  );
}
