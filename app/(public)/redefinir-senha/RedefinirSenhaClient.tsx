"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AnimatedLink } from "@/components/ui/AnimatedLink";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryLink } from "@/components/ui/PrimaryLink";
import authStyles from "@/styles/auth-card.module.css";
import { submitResetPasswordRequest } from "@/lib/auth/submit-reset-password";

const schema = z
  .object({
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.confirm.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirme sua senha",
        path: ["confirm"],
      });
      return;
    }
    if (data.newPassword !== data.confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem",
        path: ["confirm"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function LinkInvalidoCard() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className={`w-full max-w-md ${authStyles.wrap}`}>
        <GlassCard className={`${authStyles.inner} !rounded-[1.2rem] border-0 p-6 sm:p-8`}>
          <h1 className="text-center text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
            Link inválido ou incompleto
          </h1>
          <p className="mt-3 text-center text-sm text-[var(--text-muted)]">
            O link precisa incluir o token enviado por e-mail, por exemplo:
          </p>
          <p className="mt-2 break-all text-center font-mono text-xs text-[var(--text-muted)]">
            /redefinir-senha?token=4e78bab1-be54-4300-a2ea-1d71b1aaccdd
          </p>
          <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
            Se o link expirou, peça um novo em <strong className="text-[var(--text-primary)]">Esqueci minha senha</strong> no
            login.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <PrimaryLink href="/login" className="w-full justify-center">
              Ir ao login
            </PrimaryLink>
            <Link
              href="/"
              className="tap-target text-center text-sm text-brand-cyan underline-offset-4 hover:underline"
            >
              Voltar ao início
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function RedefinirSenhaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const hasValidQuery = token.length > 0;

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const newPasswordValue = watch("newPassword");

  useEffect(() => {
    if (!touchedFields.confirm) return;
    void trigger("confirm");
  }, [newPasswordValue, touchedFields.confirm, trigger]);

  if (!hasValidQuery) {
    return <LinkInvalidoCard />;
  }

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setSubmitting(true);
    try {
      const result = await submitResetPasswordRequest(token, data.newPassword);
      if (!result.ok) {
        setApiError(result.message);
        return;
      }
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className={`w-full max-w-md ${authStyles.wrap}`}>
        <GlassCard className={`${authStyles.inner} !rounded-[1.2rem] border-0 p-6 sm:p-8`}>
          <h1 className="text-center text-2xl font-bold text-[var(--text-primary)]">Redefinir senha</h1>
          <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
            Crie uma nova senha para sua conta. Este link foi enviado ao seu e-mail; mantenha-o em sigilo.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
            {apiError && (
              <p
                className="rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink"
                role="alert"
              >
                {apiError}
              </p>
            )}
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Nova senha
              </label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-brand-pink" role="alert">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Confirmar nova senha
              </label>
              <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
              {errors.confirm && (
                <p className="mt-1 text-sm text-brand-pink" role="alert">
                  {errors.confirm.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </form>
          <p className="mt-6 text-center">
            <AnimatedLink href="/login">← Voltar ao login</AnimatedLink>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
