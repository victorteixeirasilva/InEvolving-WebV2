"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitForgotPasswordRequest } from "@/lib/auth/submit-forgot-password";

const ease = [0.16, 1, 0.3, 1] as const;

const schema = z.object({
  userEmail: z.string().email("Digite um e-mail válido"),
});

type FormValues = z.infer<typeof schema>;

export type ForgotPasswordModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** E-mail já digitado no formulário de login (opcional). */
  initialEmail?: string;
};

export function ForgotPasswordModal({ open, onOpenChange, initialEmail = "" }: ForgotPasswordModalProps) {
  const [phase, setPhase] = useState<"form" | "success" | "error">("form");
  const [submitting, setSubmitting] = useState(false);
  const initialEmailRef = useRef(initialEmail);
  initialEmailRef.current = initialEmail;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userEmail: "" },
  });

  useEffect(() => {
    if (!open) {
      reset({ userEmail: "" });
      setPhase("form");
      setSubmitting(false);
      return;
    }
    reset({ userEmail: initialEmailRef.current.trim() });
    setPhase("form");
    setSubmitting(false);
  }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const { ok } = await submitForgotPasswordRequest(data.userEmail);
      setPhase(ok ? "success" : "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[70] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
            "dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[70] flex max-h-dvh items-center justify-center overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 outline-none"
          aria-describedby="forgot-password-desc"
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
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />
              <Dialog.Close
                type="button"
                className="tap-target -mr-1 -mt-1 shrink-0 rounded-xl p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-6 w-6" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="pr-8 text-lg font-extrabold text-[var(--text-primary)] sm:text-xl">
              Recuperar senha
            </Dialog.Title>
            <p id="forgot-password-desc" className="mt-2 text-sm text-[var(--text-muted)]">
              {phase === "form" &&
                "Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos instruções para redefinir a senha."}
              {phase === "success" &&
                "Se esse e-mail estiver associado a uma conta, você receberá em instantes um link para criar uma nova senha. Verifique também a pasta de spam."}
              {phase === "error" &&
                "Não foi possível processar o pedido agora. Tente novamente em alguns minutos ou entre em contato com o suporte."}
            </p>

            {phase === "form" && (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
                <div>
                  <label htmlFor="forgot-userEmail" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    E-mail
                  </label>
                  <Input
                    id="forgot-userEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    {...register("userEmail")}
                  />
                  {errors.userEmail && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.userEmail.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                    {submitting ? "Enviando…" : "Enviar link"}
                  </Button>
                </div>
              </form>
            )}

            {phase !== "form" && (
              <div className="mt-6 flex justify-end">
                <Dialog.Close asChild>
                  <Button type="button" className="w-full sm:w-auto">
                    Fechar
                  </Button>
                </Dialog.Close>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
