"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedLink } from "@/components/ui/AnimatedLink";
import { GlassCard } from "@/components/ui/GlassCard";
import { STORAGE_KEYS } from "@/lib/constants";
import authStyles from "@/styles/auth-card.module.css";
import { LoginFeedbackModal } from "@/components/features/auth/LoginFeedbackModal";
import { ForgotPasswordModal } from "@/components/features/auth/ForgotPasswordModal";
import { submitLoginRequest } from "@/lib/auth/submit-login";
import type { LoginErrorCode } from "@/lib/auth/login-result";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<LoginErrorCode | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const loginEmail = watch("email");

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const result = await submitLoginRequest(data.email, data.password);
      if (!result.ok) {
        setFeedback(result.code);
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.token, result.token);
        localStorage.setItem(STORAGE_KEYS.email, data.email);
        if (result.urlVisionBord !== undefined) {
          localStorage.setItem(STORAGE_KEYS.urlVisionBord, result.urlVisionBord);
        }
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <LoginFeedbackModal
        open={feedback !== null}
        code={feedback}
        onOpenChange={(open) => {
          if (!open) setFeedback(null);
        }}
      />
      <ForgotPasswordModal
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        initialEmail={loginEmail}
      />
      <div className="flex min-h-dvh items-center justify-center px-4 py-16">
        <div className={`w-full max-w-md ${authStyles.wrap}`}>
          <GlassCard className={`${authStyles.inner} !rounded-[1.2rem] border-0 p-6 sm:p-8`}>
            <h1 className="text-center text-2xl font-bold text-[var(--text-primary)]">Entrar</h1>
            <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
              Use sua conta InEvolving. 
              {/* Avisos da API são exibidos em um pop-up quando necessário. */}
            </p>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-8 flex flex-col gap-4"
              noValidate
            >
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  E-mail
                </label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && (
                  <p className="mt-1 text-sm text-brand-pink" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-brand-pink" role="alert">
                    {errors.password.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-sm font-medium text-brand-cyan underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                {submitting ? "Entrando…" : "Continuar"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
              Não tem conta? <AnimatedLink href="/cadastro">Cadastre-se</AnimatedLink>
            </p>
            <p className="mt-2 text-center">
              <AnimatedLink href="/">← Voltar ao início</AnimatedLink>
            </p>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
