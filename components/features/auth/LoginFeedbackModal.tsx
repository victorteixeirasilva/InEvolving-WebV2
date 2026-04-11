"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LoginErrorCode } from "@/lib/auth/login-result";
import { WHATSAPP_RENEWAL_URL } from "@/lib/constants";

const ease = [0.16, 1, 0.3, 1] as const;

const COPY: Record<
  LoginErrorCode,
  { title: string; description: string; titleId: string; descId: string }
> = {
  EMAIL_UNVERIFIED: {
    title: "E-mail não confirmado",
    description:
      "Antes de entrar, confirme seu e-mail clicando no link que enviamos para sua caixa de entrada. Se não encontrar, verifique a pasta de spam.",
    titleId: "login-modal-email-title",
    descId: "login-modal-email-desc",
  },
  INVALID_CREDENTIALS: {
    title: "E-mail ou senha incorretos",
    description:
      "Não foi possível entrar. Verifique se o e-mail e a senha estão corretos ou use a opção de recuperar senha, se disponível.",
    titleId: "login-modal-invalid-title",
    descId: "login-modal-invalid-desc",
  },
  PLAN_EXPIRED: {
    title: "Plano expirado",
    description:
      "Seu acesso ao InEvolving está suspenso porque o plano expirou. Fale conosco pelo WhatsApp para renovar e voltar a usar a plataforma.",
    titleId: "login-modal-plan-title",
    descId: "login-modal-plan-desc",
  },
  SERVER_ERROR: {
    title: "Não foi possível entrar",
    description:
      "O serviço está indisponível ou a resposta foi inesperada. Verifique sua conexão e tente de novo em alguns instantes.",
    titleId: "login-modal-server-title",
    descId: "login-modal-server-desc",
  },
};

export type LoginFeedbackModalProps = {
  open: boolean;
  code: LoginErrorCode | null;
  onOpenChange: (open: boolean) => void;
};

export function LoginFeedbackModal({ open, code, onOpenChange }: LoginFeedbackModalProps) {
  if (!code) return null;

  const c = COPY[code];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex max-h-dvh items-center justify-center overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 outline-none"
          aria-labelledby={c.titleId}
          aria-describedby={c.descId}
        >
          <motion.div
            className={cn(
              "relative w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] p-6 shadow-glass-lg backdrop-blur-glass",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="mb-4 h-1 w-full origin-left rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />

            <Dialog.Title
              id={c.titleId}
              className="text-lg font-extrabold text-[var(--text-primary)] sm:text-xl"
            >
              {c.title}
            </Dialog.Title>
            <Dialog.Description
              id={c.descId}
              className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]"
            >
              {c.description}
            </Dialog.Description>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {code === "PLAN_EXPIRED" ? (
                <>
                  <a
                    href={WHATSAPP_RENEWAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "tap-target inline-flex items-center justify-center rounded-xl px-5 py-3 text-center text-sm font-semibold",
                      "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow transition-all duration-[380ms]",
                      "hover:shadow-glass-lg dark:from-brand-purple dark:to-brand-pink"
                    )}
                  >
                    Renovar pelo WhatsApp
                  </a>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className={cn(
                        "tap-target rounded-xl border border-[var(--glass-border)] px-5 py-3 text-sm font-semibold",
                        "text-[var(--text-primary)] transition-all duration-[380ms] hover:border-brand-cyan/40"
                      )}
                    >
                      Fechar
                    </button>
                  </Dialog.Close>
                </>
              ) : (
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className={cn(
                      "tap-target w-full rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto",
                      "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow",
                      "dark:from-brand-purple dark:to-brand-pink"
                    )}
                  >
                    Entendi
                  </button>
                </Dialog.Close>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
