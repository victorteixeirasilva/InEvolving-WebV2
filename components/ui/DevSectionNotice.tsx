"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export type DevSectionNoticeProps = {
  /** Texto após "Em desenvolvimento." — se omitido, usa o texto genérico. */
  message?: string;
  className?: string;
};

const DEFAULT_MESSAGE =
  "Esta funcionalidade ainda não está finalizada; o que você vê aqui pode mudar quando integrarmos com o servidor.";

export function DevSectionNotice({ message = DEFAULT_MESSAGE, className }: DevSectionNoticeProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-brand-cyan/25 bg-brand-cyan/[0.07] px-3 py-2.5 text-sm text-[var(--text-primary)]",
        className
      )}
      role="status"
    >
      <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" aria-hidden />
      <p className="leading-snug text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text-primary)]">Em desenvolvimento.</span> {message}
      </p>
    </div>
  );
}
