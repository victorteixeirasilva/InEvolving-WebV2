"use client";

import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const HIDE_DELAY_MS = 220;

function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type FinancasTotalBalanceCardProps = {
  totalBalance: number;
};

/**
 * Saldo consolidado do período vindo do backend (entradas − saídas, já alinhado à regra 10%).
 */
export function FinancasTotalBalanceCard({ totalBalance }: FinancasTotalBalanceCardProps) {
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

  const isPositive = totalBalance > 0;
  const isNegative = totalBalance < 0;
  const isZero = totalBalance === 0;

  return (
    <motion.div
      layout
      initial={false}
      animate={
        isNegative && !reduceMotion
          ? {
              x: [0, -2, 2, -2, 2, 0],
              boxShadow: [
                "0 0 0 0 rgba(239, 68, 68, 0)",
                "0 0 0 2px rgba(239, 68, 68, 0.55), 0 0 32px rgba(239, 68, 68, 0.25)",
                "0 0 0 0 rgba(239, 68, 68, 0)",
              ],
            }
          : isPositive && !reduceMotion
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(16, 185, 129, 0)",
                  "0 0 0 1px rgba(16, 185, 129, 0.45), 0 0 28px rgba(16, 185, 129, 0.15)",
                  "0 0 0 0 rgba(16, 185, 129, 0)",
                ],
              }
            : {}
      }
      transition={
        isNegative && !reduceMotion
          ? {
              x: { duration: 0.5, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" },
              boxShadow: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
            }
          : isPositive && !reduceMotion
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : {}
      }
    >
      <GlassCard
        hoverLift={false}
        className={cn(
          "relative overflow-hidden transition-colors duration-300",
          isNegative &&
            "border-2 border-red-500/70 bg-red-500/[0.12] shadow-[0_0_40px_rgba(239,68,68,0.22),0_0_0_1px_rgba(239,68,68,0.15)_inset] dark:border-red-500/65 dark:bg-red-950/45 dark:shadow-[0_0_48px_rgba(239,68,68,0.28)]",
          isPositive &&
            "border-emerald-500/45 bg-emerald-500/[0.08] shadow-[0_0_28px_rgba(16,185,129,0.14)] dark:border-emerald-400/35 dark:bg-emerald-950/25 dark:shadow-[0_0_32px_rgba(16,185,129,0.18)]",
          isZero &&
            "border-amber-500/35 bg-amber-500/[0.06] dark:border-amber-400/30 dark:bg-amber-950/20"
        )}
      >
        {isNegative && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.65, 1, 0.65], scaleX: [0.98, 1, 0.98] }}
            transition={
              reduceMotion ? {} : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
          />
        )}
        {isPositive && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-90"
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Balanço total do mês
              </p>
              {isNegative && (
                <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm dark:bg-red-500">
                  Atenção
                </span>
              )}
              {isPositive && (
                <span className="inline-flex items-center rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm dark:bg-emerald-500/90">
                  Positivo
                </span>
              )}
            </div>

            {isNegative && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/15 p-2.5 dark:bg-red-950/50"
                role="alert"
              >
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                <p className="text-sm font-bold leading-snug text-red-900 dark:text-red-100">
                  Balanço negativo: suas saídas superaram as entradas neste período. Reavalie prioridades,
                  corte excessos e ajuste o plano antes que o déficit se arraste.
                </p>
              </motion.div>
            )}

            {isZero && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200"
                role="status"
              >
                <ScaleIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                Saldo zerado: você está no limite do orçamento — vale revisar gastos e buscar margem.
              </motion.p>
            )}

            {isPositive && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300/95"
                role="status"
              >
                <ArrowTrendingUpIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Sobrou recurso após o período: ótimo sinal — use com intenção (reserva, metas ou investimento).
              </motion.p>
            )}
          </div>

          <div className="flex shrink-0 items-start justify-between gap-3 sm:flex-col sm:items-end">
            <Popover.Root open={infoOpen} onOpenChange={setInfoOpen} modal={false}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                    "border-[var(--glass-border)] text-[var(--text-muted)]",
                    "hover:border-brand-cyan/40 hover:bg-white/5 hover:text-brand-cyan",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50",
                    isNegative &&
                      "border-red-400/50 text-red-700 hover:border-red-400 hover:bg-red-500/15 hover:text-red-600 dark:text-red-300",
                    isPositive &&
                      "border-emerald-500/40 text-emerald-700 hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                  )}
                  aria-label="Informações sobre o balanço total do mês"
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
                    "z-[80] w-[min(calc(100vw-1.5rem),24rem)] rounded-2xl border border-[var(--glass-border)] p-0 outline-none",
                    "bg-[color-mix(in_srgb,var(--glass-bg)_88%,transparent)] shadow-glass-lg backdrop-blur-xl"
                  )}
                  onPointerEnter={cancelHide}
                  onPointerLeave={scheduleHide}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="max-h-[min(72dvh,480px)] overflow-y-auto p-4 sm:p-5"
                  >
                    <div className="mb-3 h-0.5 w-14 rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-emerald-500" />
                    <h3 className="text-sm font-bold leading-snug text-[var(--text-primary)] sm:text-base">
                      Balanço total do mês — leitura estratégica
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                      Depois de considerar salário, entradas extras, custo de vida e investimentos (incluindo a
                      lógica do 10% para o futuro), este número é o{" "}
                      <strong className="font-semibold text-[var(--text-primary)]">resultado líquido</strong> do
                      período no app — o “veredito” que mostra se você está acumulando, equilibrando ou
                      precisando ajustar.
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                      Como interpretar
                    </p>
                    <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>
                          <strong className="font-medium text-[var(--text-primary)]">Positivo:</strong> margem
                          real — reforçar reserva, acelerar metas, investir mais ou amortizar dívidas com método.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                        <span>
                          <strong className="font-medium text-[var(--text-primary)]">Zerado:</strong> limite fino —
                          revise categorias, previsões e próximos compromissos antes de novos gastos.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                        <span>
                          <strong className="font-medium text-[var(--text-primary)]">Negativo:</strong> saídas
                          acima das entradas — priorize correção rápida (cortes, renegociação, replanejamento).
                        </span>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                      O que fazer com o que sobrou
                    </p>
                    <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" aria-hidden />
                        <span>Reinvestir com critério, alinhado à sua estratégia de longo prazo.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                        <span>Quitar ou reduzir dívidas caras para ganhar folga e previsibilidade.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" aria-hidden />
                        <span>Construir colchão de emergência para imprevistos sem desmontar o plano.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                        <span>Se as bases estiverem sólidas, recompensas conscientes entram sem culpa — com teto claro.</span>
                      </li>
                    </ul>
                    <p className="mt-4 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] p-3 text-xs leading-relaxed text-[var(--text-muted)] dark:bg-white/[0.02] sm:text-sm">
                      O valor é calculado no servidor e reflete o período selecionado. Use-o como bússola mensal,
                      não como julgamento único: o hábito de revisar e ajustar é o que sustenta o resultado.
                    </p>
                  </motion.div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <p
              className={cn(
                "text-right text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl",
                isNegative && "text-red-600 dark:text-red-400",
                isPositive && "text-emerald-700 dark:text-emerald-400",
                isZero && "text-[var(--text-primary)]"
              )}
            >
              {isNegative && (
                <span className="mr-1 inline-block align-middle" aria-hidden>
                  <ArrowTrendingDownIcon className="inline h-7 w-7 opacity-90 sm:h-8 sm:w-8" />
                </span>
              )}
              {formatBrl(totalBalance)}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
