"use client";

import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import {
  CheckBadgeIcon,
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

export type FinancasAvailableInvestCardProps = {
  balanceAvailableToInvest: number;
};

/**
 * `balanceAvailableToInvest` vem do backend. Valor negativo indica que a meta
 * mínima de investimento do período já foi atingida ou superada.
 */
export function FinancasAvailableInvestCard({
  balanceAvailableToInvest,
}: FinancasAvailableInvestCardProps) {
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

  const isNegative = balanceAvailableToInvest < 0;

  return (
    <motion.div
      className="h-full min-h-[1px]"
      layout
      initial={false}
      animate={
        isNegative && !reduceMotion
          ? {
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0)",
                "0 0 0 1px rgba(16, 185, 129, 0.4)",
                "0 0 0 0 rgba(16, 185, 129, 0)",
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
            "border-emerald-500/45 bg-emerald-500/[0.08] shadow-[0_0_24px_rgba(16,185,129,0.14)] dark:border-emerald-400/35 dark:bg-emerald-950/30 dark:shadow-[0_0_28px_rgba(16,185,129,0.2)]"
        )}
      >
        {isNegative && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
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
                Teto 10% — disponível para investimento
              </p>
            {isNegative && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                role="status"
              >
                <CheckBadgeIcon className="h-4 w-4 shrink-0" aria-hidden />
                Você já investiu pelo menos o mínimo planejado para este mês.
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
                    "border-emerald-500/40 text-emerald-600 hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-500 dark:text-emerald-400"
                )}
                aria-label="Informações sobre os 10% para investimento"
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
                  className="max-h-[min(70dvh,440px)] overflow-y-auto p-4 sm:p-5"
                >
                  <div className="mb-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan" />
                  <h3 className="text-sm font-bold leading-snug text-[var(--text-primary)] sm:text-base">
                    Os 10% — seu futuro em primeiro lugar
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    Esta fatia da sua renda é{" "}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      prioridade, não opcional
                    </strong>
                    : não é para consumo parcelado, “só desta vez” ou ajuste fino no cartão. É o
                    aporte que o sistema reserva para{" "}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      investimento e construção de patrimônio
                    </strong>
                    — a base da sua tranquilidade financeira no longo prazo.
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    Na linha da regra babilônica, a ideia é tratar esse valor como algo que sai{" "}
                    <span className="font-medium text-[var(--text-primary)]">antes</span> das despesas
                    correntes: como um capital que trabalha para você o tempo todo, acumulando
                    reserva e oportunidade.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-cyan sm:text-[0.7rem]">
                    Com o tempo
                  </p>
                  <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" aria-hidden />
                      <span>Esses 10% viram reserva de emergência, aportes consistentes e liberdade de escolha.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                      <span>Tudo começa com um hábito simples: separar antes de gastar — método, não sorte.</span>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] p-3 text-xs leading-relaxed text-[var(--text-muted)] dark:bg-white/[0.02] sm:text-sm">
                    O número deste card é calculado no servidor. Quando aparece{" "}
                    <span className="font-medium text-[var(--text-primary)]">negativo</span>, significa
                    que você já cumpriu (ou superou) o mínimo de investimento previsto para o período —
                    um bom sinal de disciplina com a regra 10%.
                  </p>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          </div>

          <p
            className={cn(
              "mt-auto pt-3 text-xl font-bold tabular-nums tracking-tight",
              isNegative ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--text-primary)]"
            )}
          >
            {formatBrl(balanceAvailableToInvest)}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
