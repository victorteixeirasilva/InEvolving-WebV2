"use client";

import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import {
  InformationCircleIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const HIDE_DELAY_MS = 220;

function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type FinancasExtraIncomeCardProps = {
  extraBalanceAdded: number;
};

/**
 * Total de entradas extras do período (`extraBalanceAdded`), conforme o backend.
 * Em zero: destaque informativo — ainda não houve renda extra registrada.
 */
export function FinancasExtraIncomeCard({ extraBalanceAdded }: FinancasExtraIncomeCardProps) {
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

  const isEmpty = extraBalanceAdded === 0;
  const isNegative = extraBalanceAdded < 0;

  return (
    <motion.div
      className="h-full min-h-[1px]"
      layout
      initial={false}
      animate={
        isEmpty && !reduceMotion
          ? {
              boxShadow: [
                "0 0 0 0 rgba(245, 158, 11, 0)",
                "0 0 0 1px rgba(245, 158, 11, 0.38)",
                "0 0 0 0 rgba(245, 158, 11, 0)",
              ],
            }
          : {}
      }
      transition={
        isEmpty && !reduceMotion
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : {}
      }
    >
      <GlassCard
        hoverLift={!isEmpty}
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden transition-colors duration-300",
          isEmpty &&
            "border-amber-500/40 bg-amber-500/[0.07] shadow-[0_0_22px_rgba(245,158,11,0.12)] dark:border-amber-400/35 dark:bg-amber-950/20 dark:shadow-[0_0_26px_rgba(245,158,11,0.16)]",
          isNegative &&
            !isEmpty &&
            "border-red-500/40 bg-red-500/[0.06] dark:border-red-500/35 dark:bg-red-950/20"
        )}
      >
        {isEmpty && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.55, 1, 0.55] }}
            transition={
              reduceMotion ? {} : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">Entradas extras</p>
              {isEmpty && (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400"
                  role="status"
                >
                  <InboxIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Você ainda não teve entrada de renda extra neste período.
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
                  isEmpty &&
                    "border-amber-500/40 text-amber-700 hover:border-amber-400/55 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400"
                )}
                aria-label="Informações sobre entradas de renda extra"
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
                  className="max-h-[min(70dvh,460px)] overflow-y-auto p-4 sm:p-5"
                >
                  <div className="mb-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-brand-pink to-brand-cyan" />
                  <h3 className="text-sm font-bold leading-snug text-[var(--text-primary)] sm:text-base">
                    Entradas extras — bônus com método
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    O orçamento não vive só do salário. Entram aqui ganhos fora da renda principal:
                    freelas, vendas pontuais, presentes em dinheiro, reembolsos relevantes ou até cashback
                    que você decide tratar como entrada — o importante é{" "}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      registrar e integrar ao plano
                    </strong>
                    , não tratar como “dinheiro que não conta”.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                    O que são
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" aria-hidden />
                      <span>Fluxos fora da folha ou do contrato principal.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                      <span>Podem ser únicos ou recorrentes — em ambos os casos entram no painel do mês.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                      <span>Somam ao planejamento para você ver saldo real, não só o salário “oficial”.</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                    Como usar com inteligência
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" aria-hidden />
                      <span>
                        Mantenha a lógica 90-10: uma parte consistente para o futuro, o restante reforça
                        orçamento, metas ou margem de segurança.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                      <span>Evite gastar só porque “não estava no plano” — isso é exatamente quando o método ajuda.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" aria-hidden />
                      <span>Use para acelerar investimentos, reserva ou quitação de dívidas, com decisão consciente.</span>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] p-3 text-xs leading-relaxed text-[var(--text-muted)] dark:bg-white/[0.02] sm:text-sm">
                    Renda extra não precisa virar desculpa para consumo extra — pode ser{" "}
                    <span className="font-medium text-[var(--text-primary)]">alavanca de crescimento</span>. O
                    valor deste card vem do servidor; em{" "}
                    <span className="font-medium text-[var(--text-primary)]">zero</span>, o período ainda não
                    registrou essas entradas.
                  </p>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          </div>

          <p
            className={cn(
              "mt-auto pt-3 text-xl font-bold tabular-nums tracking-tight",
              isEmpty && "text-amber-900 dark:text-amber-300",
              !isEmpty && isNegative && "text-red-600 dark:text-red-400",
              !isEmpty && !isNegative && "text-[var(--text-primary)]"
            )}
          >
            {formatBrl(extraBalanceAdded)}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
