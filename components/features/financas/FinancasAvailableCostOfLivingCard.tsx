"use client";

import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const HIDE_DELAY_MS = 220;

function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type FinancasAvailableCostOfLivingCardProps = {
  availableCostOfLivingBalance: number;
};

export function FinancasAvailableCostOfLivingCard({
  availableCostOfLivingBalance,
}: FinancasAvailableCostOfLivingCardProps) {
  const reduceMotion = useReducedMotion();
  const [infoOpen, setInfoOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => setInfoOpen(false), HIDE_DELAY_MS);
  }, [cancelHide]);

  const showInfo = useCallback(() => {
    cancelHide();
    setInfoOpen(true);
  }, [cancelHide]);

  useEffect(() => () => cancelHide(), [cancelHide]);

  const isNegative = availableCostOfLivingBalance < 0;

  return (
    <motion.div
      className="h-full min-h-[1px]"
      layout
      initial={false}
      animate={
        isNegative && !reduceMotion
          ? {
              boxShadow: [
                "0 0 0 0 rgba(239, 68, 68, 0)",
                "0 0 0 1px rgba(239, 68, 68, 0.35)",
                "0 0 0 0 rgba(239, 68, 68, 0)",
              ],
            }
          : {}
      }
      transition={
        isNegative && !reduceMotion
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
    >
      <GlassCard
        hoverLift={!isNegative}
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden transition-colors duration-300",
          isNegative &&
            "border-red-500/45 bg-red-500/[0.07] shadow-[0_0_24px_rgba(239,68,68,0.12)] dark:border-red-500/40 dark:bg-red-950/25 dark:shadow-[0_0_28px_rgba(239,68,68,0.18)]"
        )}
      >
        {isNegative && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.55, 1, 0.55] }}
            transition={
              reduceMotion ? {} : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Teto 90% — disponível para custo de vida
              </p>
              {isNegative && (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                  role="status"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Você ultrapassou o limite planejado para o custo de vida neste período.
                </motion.p>
              )}
            </div>

            <Popover.Root open={infoOpen} onOpenChange={setInfoOpen} modal={false}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  "border-[var(--glass-border)] text-[var(--text-muted)]",
                  "hover:border-brand-cyan/40 hover:bg-white/5 hover:text-brand-cyan",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50",
                  isNegative &&
                    "border-red-500/35 text-red-500 hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-400 dark:text-red-400"
                )}
                aria-label="Informações sobre o teto de 90% para custo de vida"
                onPointerEnter={showInfo}
                onPointerLeave={scheduleHide}
              >
                <InformationCircleIcon className="h-5 w-5" aria-hidden />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="bottom"
                align="end"
                sideOffset={8}
                collisionPadding={16}
                className={cn(
                  "z-[80] w-[min(calc(100vw-1.5rem),22rem)] rounded-2xl border border-[var(--glass-border)] p-0 outline-none",
                  "bg-[color-mix(in_srgb,var(--glass-bg)_88%,transparent)] shadow-glass-lg backdrop-blur-xl"
                )}
                onPointerEnter={cancelHide}
                onPointerLeave={scheduleHide}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="max-h-[min(70dvh,420px)] overflow-y-auto p-4 sm:p-5"
                >
                  <div className="mb-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan" />
                  <h3 className="text-sm font-bold leading-snug text-[var(--text-primary)] sm:text-base">
                    Os 90% — viver com método
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    Sua renda total orienta o painel, mas o foco aqui é{" "}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      viver dentro dos 90%
                    </strong>
                    : o montante que o backend destina ao custo de vida — moradia, alimentação,
                    transporte, saúde e também lazer planejado, sem culpa.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                    Objetivo
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                      <span>Quebrar o ciclo ganha–gasta–aperta: decisões com visão de mês, não só de impulso.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" aria-hidden />
                      <span>Manter hábitos sustentáveis e evitar dívidas que comprometem o que você está construindo.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                      <span>Priorizar o que importa para você, com clareza entre necessidade, conforto e extras.</span>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] p-3 text-xs leading-relaxed text-[var(--text-muted)] dark:bg-white/[0.02] sm:text-sm">
                    Gastar tudo o que entra é fácil;{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      viver com limite e ainda prosperar
                    </span>{" "}
                    é o que separa rotina financeira de estratégia. O valor deste card vem do servidor —
                    negativo significa que, neste período, o custo de vida ultrapassou o teto dos 90%
                    definido para você.
                  </p>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          </div>

          <p
            className={cn(
              "mt-auto pt-3 text-xl font-bold tabular-nums tracking-tight",
              isNegative ? "text-red-600 dark:text-red-400" : "text-[var(--text-primary)]"
            )}
          >
            {formatBrl(availableCostOfLivingBalance)}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
