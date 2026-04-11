"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
};

/** Trilho com bolinha: inativa à esquerda, ativa à direita, sem transbordar. */
export function RecurringTaskSwitch({ checked, onCheckedChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300",
        checked
          ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
          : "border-[var(--glass-border)] text-[var(--text-muted)] hover:border-brand-cyan/30",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <ArrowPathIcon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 text-left">Tarefa recorrente</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          checked ? "bg-brand-cyan" : "bg-[var(--glass-border)]"
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-[left] duration-300 ease-out dark:ring-white/15",
            checked ? "left-[calc(100%-1.25rem-0.125rem)]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
