"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { postCategoryObjective } from "@/lib/categories/category-objective-link";
import { postCategory } from "@/lib/categories/post-category";
import { STORAGE_KEYS } from "@/lib/constants";
import { ObjetivosEditor, useAllObjectives } from "./ObjetivosEditor";
import type { Category, Objective } from "@/lib/types/models";

const ease = [0.16, 1, 0.3, 1] as const;

const schema = z.object({
  categoryName: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(80, "Máximo 80 caracteres"),
  categoryDescription: z.string().max(240, "Máximo 240 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

export type NovaCategoriaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após criar com sucesso — recebe a nova categoria completa. */
  onCreated: (category: Category) => void;
};

export function NovaCategoriaModal({
  open,
  onOpenChange,
  onCreated,
}: NovaCategoriaModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [localObjectives, setLocalObjectives] = useState<Objective[]>([]);

  const allObjectives = useAllObjectives(open);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { categoryName: "", categoryDescription: "" },
  });

  /* reset completo ao abrir/fechar */
  useEffect(() => {
    if (!open) {
      setApiError(null);
      setLocalObjectives([]);
      return;
    }
    reset({ categoryName: "", categoryDescription: "" });
    setApiError(null);
    setLocalObjectives([]);
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
        // TODO (contract): token ausente — redirecionar para `/login`.
        setApiError("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const nomeCategoria = data.categoryName.trim();
      const categoryDescription = (data.categoryDescription ?? "").trim();

      /* 1 – criar categoria (API) */
      const createRes = await postCategory(jwtToken, {
        categoryName: nomeCategoria,
        categoryDescription,
      });

      if (createRes.kind === "unauthorized") {
        onOpenChange(false);
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }

      if (createRes.kind !== "ok") {
        // TODO (contract): mensagem do corpo em 4xx quando padronizada.
        setApiError("Não foi possível criar a categoria. Tente novamente.");
        return;
      }

      const newId = createRes.id;

      /* 2 – vincular objetivos selecionados (API) */
      for (const o of localObjectives) {
        const linkRes = await postCategoryObjective(jwtToken, newId, o.id);
        if (linkRes.kind === "unauthorized") {
          onOpenChange(false);
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }
        if (linkRes.kind !== "ok") {
          window.alert(`Erro ao associar objetivo à categoria: id do Objetivo ${o.id}`);
          // TODO (contract): categoria já criada sem todos os vínculos — refetch ou compensação.
          return;
        }
      }

      onCreated({
        id: newId,
        categoryName: nomeCategoria,
        categoryDescription,
        objectives: localObjectives,
      });
      onOpenChange(false);
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSave = isDirty || localObjectives.length > 0;

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
          aria-describedby="nova-cat-desc"
        >
          <motion.div
            className={cn(
              "relative my-auto w-full max-w-[min(100%,34rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
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
                    Nova categoria
                  </Dialog.Title>
                  <p id="nova-cat-desc" className="mt-0.5 text-sm text-[var(--text-muted)]">
                    Defina nome, descrição. Primeiro Crie a Categoria Para depois Adicionar seus objetivos.
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

                {/* ── Nome ── */}
                <div>
                  <label
                    htmlFor="nova-cat-name"
                    className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Nome <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <Input
                    id="nova-cat-name"
                    placeholder="Ex.: Finanças"
                    {...register("categoryName")}
                  />
                  {errors.categoryName && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.categoryName.message}
                    </p>
                  )}
                </div>

                {/* ── Descrição ── */}
                <div>
                  <label
                    htmlFor="nova-cat-desc"
                    className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Descrição{" "}
                    <span className="text-xs text-[var(--text-muted)]">(opcional)</span>
                  </label>
                  <textarea
                    id="nova-cat-desc"
                    rows={3}
                    placeholder="Uma breve descrição desta categoria…"
                    className={cn(
                      "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
                      "text-sm text-[var(--text-primary)] backdrop-blur-glass placeholder:text-[var(--text-muted)]",
                      "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
                      "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
                    )}
                    {...register("categoryDescription")}
                  />
                  {errors.categoryDescription && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.categoryDescription.message}
                    </p>
                  )}
                </div>

                {/* ── Objetivos ── */}
                {/* <ObjetivosEditor
                  objectives={localObjectives}
                  onChange={setLocalObjectives}
                  allObjectives={allObjectives}
                /> */}

                {/* ── Rodapé ── */}
                <div className="flex gap-2 border-t border-[var(--glass-border)] pt-4 sm:justify-end">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    className="flex-1 sm:flex-none"
                    disabled={submitting || !canSave}
                  >
                    {submitting ? "Criando…" : "Criar categoria"}
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
