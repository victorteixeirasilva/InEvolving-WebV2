"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { STORAGE_KEYS } from "@/lib/constants";
import { postObjective } from "@/lib/objectives/post-objective";
import type { Objective } from "@/lib/types/models";

const ease = [0.16, 1, 0.3, 1] as const;

const schema = z.object({
  nameObjective: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Máximo 100 caracteres"),
  descriptionObjective: z.string().max(300, "Máximo 300 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

export type NovoObjetivoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (objective: Objective) => void;
};

export function NovoObjetivoModal({ open, onOpenChange, onCreated }: NovoObjetivoModalProps) {
  const router = useRouter();
  const didRedirect401Ref = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nameObjective: "", descriptionObjective: "" },
  });

  useEffect(() => {
    if (!open) { setApiError(null); return; }
    reset({ nameObjective: "", descriptionObjective: "" });
    setApiError(null);
  }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setSubmitting(true);
    try {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): redirecionar para `/login` em vez de só mensagem.
        setApiError("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const result = await postObjective(jwtToken, {
        nameObjective: data.nameObjective.trim(),
        descriptionObjective: (data.descriptionObjective ?? "").trim(),
      });

      if (result.kind === "unauthorized") {
        if (!didRedirect401Ref.current) {
          didRedirect401Ref.current = true;
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
        }
        return;
      }

      if (result.kind === "ok") {
        onCreated(result.objective);
        onOpenChange(false);
        return;
      }

      if (result.kind === "invalid_response") {
        // TODO (contract): após alinhar contrato, remover esta ramificação ou disparar refetch da lista.
        setApiError("Resposta inesperada do servidor ao criar o objetivo. Atualize a página.");
        return;
      }

      // TODO (contract): mensagem do corpo em 4xx/5xx quando padronizada; retry para 503/429.
      setApiError("Não foi possível criar o objetivo. Tente novamente.");
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[60] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[60] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 outline-none"
          aria-describedby="novo-obj-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-[min(100%,30rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass",
              "dark:shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            )}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease }}
          >
            {/* accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-pink" />

            <div className="p-6">
              {/* header */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-extrabold text-[var(--text-primary)]">
                    Novo objetivo
                  </Dialog.Title>
                  <p id="novo-obj-desc" className="mt-0.5 text-sm text-[var(--text-muted)]">
                    Defina o nome e a descrição do objetivo a ser criado.
                  </p>
                </div>
                <Dialog.Close
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                {apiError && (
                  <p
                    className="rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink"
                    role="alert"
                  >
                    {apiError}
                  </p>
                )}

                {/* Nome */}
                <div>
                  <label
                    htmlFor="obj-name"
                    className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Nome <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <Input
                    id="obj-name"
                    placeholder="Ex.: Conquistar certificação AWS"
                    {...register("nameObjective")}
                  />
                  {errors.nameObjective && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.nameObjective.message}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label
                    htmlFor="obj-desc"
                    className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Descrição{" "}
                    <span className="text-xs text-[var(--text-muted)]">(opcional)</span>
                  </label>
                  <textarea
                    id="obj-desc"
                    rows={4}
                    placeholder="Descreva o objetivo, critérios de sucesso ou contexto relevante…"
                    className={cn(
                      "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                      "text-sm text-[var(--text-primary)] backdrop-blur-glass placeholder:text-[var(--text-muted)]",
                      "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
                      "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
                    )}
                    {...register("descriptionObjective")}
                  />
                  {errors.descriptionObjective && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.descriptionObjective.message}
                    </p>
                  )}
                </div>

                {/* Rodapé */}
                <div className="flex gap-2 border-t border-[var(--glass-border)] pt-4 sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none"
                    disabled={submitting || !isDirty}
                  >
                    {submitting ? "Criando…" : "Criar objetivo"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
