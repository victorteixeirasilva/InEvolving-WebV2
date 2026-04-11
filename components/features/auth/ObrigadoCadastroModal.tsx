"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  "Confirme seu e-mail no link enviado.",
  "Fique atento(a) aos próximos passos no seu e-mail.",
  "Nossa equipe entrará em contato com você em breve.",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ObrigadoCadastroModal({ open, onOpenChange }: Props) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
    router.push("/login");
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 lg:pb-8 outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Obrigado por se cadastrar</Dialog.Title>
          <Dialog.Description className="sr-only">
            Confirme seu e-mail no link enviado antes de fazer login.
          </Dialog.Description>

          <motion.div
            className={cn(
              "relative w-full max-w-[min(100%,42rem)] overflow-hidden rounded-[28px] border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease }}
          >
            {/* Accent bar — gradiente marca */}
            <motion.div
              className="absolute left-0 top-0 h-1.5 w-full origin-left rounded-t-[28px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.05 }}
            />

            <div className="relative px-5 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
              {/* Badge IE */}
              <motion.div
                className={cn(
                  "mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[14px]",
                  "bg-gradient-to-br from-navy to-[#0B0E31] text-sm font-extrabold tracking-wide text-white",
                  "shadow-[0_10px_24px_rgba(25,118,210,0.35)] ring-1 ring-brand-cyan/30",
                  "dark:from-[#0F1419] dark:to-navy dark:shadow-glow-purple"
                )}
                initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.06 }}
              >
                IE
              </motion.div>

              <motion.p
                className="mb-2.5 text-start text-[22px] font-extrabold leading-tight text-[var(--text-primary)] sm:text-[26px]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.42, ease, delay: 0.08 }}
              >
                Obrigado por se cadastrar!
              </motion.p>

              <motion.p
                className="mb-3.5 text-start text-base font-medium leading-snug text-[var(--text-muted)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.12 }}
              >
                Antes de começarmos,{" "}
                <span className="font-extrabold text-[var(--text-primary)]">confirme seu e-mail</span> — clicando no
                link que acabamos de enviar.
              </motion.p>

              <motion.div
                className="mb-4 flex flex-col gap-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
              >
                {STEPS.map((text, index) => (
                  <motion.div
                    key={text}
                    className={cn(
                      "flex items-start gap-2.5 rounded-[14px] border border-[var(--glass-border)] px-3 py-3",
                      "bg-black/[0.03] dark:bg-white/[0.06]"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.42, ease, delay: 0.18 + index * 0.08 }}
                  >
                    <div
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-brand-cyan to-brand-pink shadow-glow"
                      aria-hidden
                    />
                    <p className="m-0 text-[13px] font-medium leading-snug text-[var(--text-muted)]">{text}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                className="mb-0 text-start text-sm font-bold leading-snug text-[var(--text-primary)]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease, delay: 0.42 }}
              >
                Fique tranquilo(a): estamos conduzindo o caminho para ver seus objetivos se plasmarem na realidade com o{" "}
                <span className="bg-gradient-to-r from-brand-cyan to-brand-pink bg-clip-text font-extrabold text-transparent">
                  InEvolving
                </span>
                !
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease, delay: 0.46 }}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href="/login"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "inline-flex text-sm font-bold text-brand-cyan underline-offset-4 transition-all duration-[380ms]",
                    "hover:text-brand-pink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
                  )}
                >
                  Ir para o login
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn(
                    "tap-target rounded-xl border border-[var(--glass-border)] bg-gradient-to-r from-brand-blue/20 to-brand-cyan/15",
                    "px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-[380ms]",
                    "hover:border-brand-cyan/50 hover:shadow-glow dark:from-brand-purple/25 dark:to-brand-pink/15"
                  )}
                >
                  Fechar
                </button>
              </motion.div>

              {/* Glow decorativo */}
              <motion.div
                className="pointer-events-none absolute -bottom-32 -right-28 h-72 w-72 rounded-full bg-gradient-to-br from-brand-cyan/25 via-brand-purple/15 to-brand-pink/20 blur-2xl"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease, delay: 0.15 }}
                aria-hidden
              />
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
