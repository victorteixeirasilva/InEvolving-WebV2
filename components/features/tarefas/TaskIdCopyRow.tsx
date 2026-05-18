"use client";

import { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import { isApiTaskUuid } from "@/lib/tasks/task-responsible";
import { cn } from "@/lib/utils";

export type TaskIdCopyRowProps = {
  taskId: string | number | undefined;
  className?: string;
};

export function TaskIdCopyRow({ taskId, className }: TaskIdCopyRowProps) {
  const [copied, setCopied] = useState(false);
  const id = taskId != null ? String(taskId).trim() : "";
  if (!id || !isApiTaskUuid(id)) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <span className="truncate font-mono text-[10px] text-[var(--text-muted)]" title={id}>
        {id}
      </span>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          void handleCopy();
        }}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg)] hover:text-brand-cyan"
        aria-label={copied ? "ID copiado" : "Copiar ID da tarefa"}
      >
        {copied ? (
          <>
            <CheckIcon className="h-3 w-3 text-emerald-400" aria-hidden />
            <span className="text-emerald-400">Copiado!</span>
          </>
        ) : (
          <ClipboardDocumentIcon className="h-3 w-3" aria-hidden />
        )}
      </button>
    </div>
  );
}
