"use client";

import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppToastStore, type AppToastItem } from "@/stores/app-toast-store";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

function ToastCard({ item, onDismiss }: { item: AppToastItem; onDismiss: () => void }) {
  const variantStyles = {
    default: "border-[var(--glass-border)]",
    success: "border-brand-cyan/40 bg-brand-cyan/[0.08]",
    error: "border-brand-pink/45 bg-brand-pink/[0.08]",
  }[item.variant];

  const bar = {
    default: "from-brand-blue via-brand-cyan to-brand-pink",
    success: "from-brand-cyan to-brand-blue",
    error: "from-brand-pink to-brand-cyan",
  }[item.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.32, ease }}
      role="status"
      className={cn(
        "pointer-events-auto relative w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-2xl border shadow-glass-lg backdrop-blur-xl",
        "bg-[color-mix(in_srgb,var(--glass-bg)_78%,transparent)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]",
        variantStyles
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", bar)} />
      <div className="flex items-start gap-2 p-3.5 sm:p-4">
        <p className="min-w-0 flex-1 text-sm leading-snug text-[var(--text-primary)]">{item.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex shrink-0 rounded-lg border border-[var(--glass-border)] p-1 text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)]"
          aria-label="Fechar notificação"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
}

export function AppToaster() {
  const [mounted, setMounted] = useState(false);
  const items = useAppToastStore((s) => s.items);
  const dismiss = useAppToastStore((s) => s.dismiss);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tree = (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  );

  if (!mounted) return null;
  return createPortal(tree, document.body);
}
