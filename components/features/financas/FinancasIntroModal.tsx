"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import {
  XMarkIcon,
  SparklesIcon,
  BanknotesIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

export type FinancasIntroModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCadastrarSalario: () => void;
};

export function FinancasIntroModal({
  open,
  onOpenChange,
  onCadastrarSalario,
}: FinancasIntroModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[70] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[70] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:p-6"
          aria-describedby="financas-intro-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-[min(100%,28rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[color-mix(in_srgb,var(--glass-bg)_72%,transparent)] shadow-glass-lg backdrop-blur-xl",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, ease }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />

            <div className="max-h-[min(85dvh,720px)] overflow-y-auto p-5 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
                    <SparklesIcon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <Dialog.Title className="text-lg font-extrabold leading-tight text-[var(--text-primary)] sm:text-xl">
                      Primeiros passos para o controle das suas finanças
                    </Dialog.Title>
                    <p
                      id="financas-intro-desc"
                      className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]"
                    >
                      Este módulo segue a <strong className="font-semibold text-[var(--text-primary)]">regra 90-10</strong>
                      , inspirada em{" "}
                      <cite className="not-italic text-brand-cyan">O Homem Mais Rico da Babilônia</cite>
                      : um hábito milenar, simples e comprovado para construir patrimônio com consistência.
                    </p>
                  </div>
                </div>
                <Dialog.Close
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Dialog.Close>
              </div>

              <motion.div
                className="space-y-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.div
                  variants={item}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/8 p-3.5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-cyan">
                      <BanknotesIcon className="h-4 w-4" aria-hidden />
                      10% — seu futuro
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Reserve uma décima parte de tudo o que entra: poupança, investimentos e metas de longo prazo.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--glass-border)] bg-white/[0.04] p-3.5 dark:bg-white/[0.03]">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      <ChartPieIcon className="h-4 w-4" aria-hidden />
                      90% — o presente
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Viva, pague contas e mantenha o dia a dia dentro do que sobra — com clareza, sem culpa.
                    </p>
                  </div>
                </motion.div>

                <motion.ul
                  variants={item}
                  className="space-y-2 rounded-xl border border-[var(--glass-border)] bg-white/[0.03] p-4 text-sm leading-relaxed text-[var(--text-muted)] dark:bg-white/[0.02]"
                >
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                    <span>
                      A filosofia é antiga; o app é moderno: visão mensal, transações e saldo para você aplicar a regra com método.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-pink" aria-hidden />
                    <span>
                      Comece pequeno, seja constante. Cadastre seu salário para personalizar o painel e acompanhar o mês com precisão.
                    </span>
                  </li>
                </motion.ul>

                <motion.p
                  variants={item}
                  className="text-center text-xs font-medium text-[var(--text-muted)]"
                >
                  Seu futuro financeiro começa com um passo simples hoje.
                </motion.p>
              </motion.div>

              <div className="mt-6 flex flex-col gap-2 border-t border-[var(--glass-border)] pt-5 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="order-2 w-full sm:order-1 sm:w-auto"
                  onClick={() => onOpenChange(false)}
                >
                  Explorar sem cadastrar
                </Button>
                <Button
                  type="button"
                  className="order-1 w-full bg-gradient-to-r from-brand-blue to-brand-cyan shadow-glow sm:order-2 sm:w-auto dark:from-brand-purple dark:to-brand-pink"
                  onClick={() => {
                    onCadastrarSalario();
                    onOpenChange(false);
                  }}
                >
                  Cadastrar meu salário
                </Button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
