"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CompartilharCategoriaModal } from "@/components/features/dashboard/CompartilharCategoriaModal";
import { ObjetivosEditor, useAllObjectives } from "./ObjetivosEditor";
import { STORAGE_KEYS } from "@/lib/constants";
import { deleteCategory } from "@/lib/categories/delete-category";
import {
  deleteCategoryObjective,
  postCategoryObjective,
} from "@/lib/categories/category-objective-link";
import { buildPatchCategoryBody, patchCategory } from "@/lib/categories/patch-category";
import { fetchCategoryObjectives } from "@/lib/dashboard/fetch-category-objectives";
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

export type EditarCategoriaModalProps = {
  open: boolean;
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  /** Chamado após salvar com sucesso — recebe categoria atualizada. */
  onSaved: (updated: Pick<Category, "id" | "categoryName" | "categoryDescription" | "objectives">) => void;
  /** Chamado após excluir com sucesso na API. */
  onDeleted?: (categoryId: string) => void;
};

export function EditarCategoriaModal({
  open,
  category,
  onOpenChange,
  onSaved,
  onDeleted,
}: EditarCategoriaModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [objectivesLoadError, setObjectivesLoadError] = useState<string | null>(null);

  const [localObjectives, setLocalObjectives] = useState<Objective[]>([]);
  const initialObjectiveIds = useRef<Set<string | number>>(new Set());

  const allObjectives = useAllObjectives(open);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { categoryName: "", categoryDescription: "" },
  });

  useEffect(() => {
    if (!open) {
      setApiError(null);
      setConfirmDelete(false);
      setShareOpen(false);
      setObjectivesLoadError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !category) return;

    const cat = category;

    let cancelled = false;
    setLoadingObjectives(true);
    setObjectivesLoadError(null);

    reset({
      categoryName: cat.categoryName,
      categoryDescription: cat.categoryDescription ?? "",
    });
    const propObjs = cat.objectives ?? [];
    setLocalObjectives(propObjs);
    initialObjectiveIds.current = new Set(propObjs.map((o) => o.id));

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): token ausente com sessão “válida” na UI — redirecionar para `/login` ou refresh de token.
        setObjectivesLoadError("Não foi possível carregar os objetivos (sessão não encontrada).");
        setLoadingObjectives(false);
        return;
      }

      const result = await fetchCategoryObjectives(cat, jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        onOpenChange(false);
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        setLoadingObjectives(false);
        return;
      }

      if (result.kind === "ok") {
        const c = result.category;
        setLocalObjectives(c.objectives);
        initialObjectiveIds.current = new Set(c.objectives.map((o) => o.id));
        reset({
          categoryName: c.categoryName,
          categoryDescription: c.categoryDescription ?? "",
        });
      } else {
        // TODO (contract): `http_error` / `network_error` — retry, toast e eventual fallback só leitura conforme produto.
        setObjectivesLoadError("Não foi possível carregar os objetivos desta categoria.");
      }

      setLoadingObjectives(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [open, category, reset, router, onOpenChange]);

  const objectivesDirty =
    localObjectives.length !== initialObjectiveIds.current.size ||
    localObjectives.some((o) => !initialObjectiveIds.current.has(o.id));

  const canSave = isDirty || objectivesDirty;

  const handleConfirmDelete = async () => {
    if (!category) return;
    setApiError(null);
    setDeleteSubmitting(true);
    try {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): token ausente — redirecionar para `/login` em vez de só mensagem.
        setApiError("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const result = await deleteCategory(category.id, jwtToken);

      if (result.kind === "unauthorized") {
        onOpenChange(false);
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }

      if (result.kind === "ok") {
        onDeleted?.(category.id);
        onOpenChange(false);
        return;
      }

      // TODO (contract): 404 como sucesso idempotente — chamar `onDeleted` se o produto assim definir.
      setApiError("Não foi possível excluir a categoria. Tente novamente.");
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!category) return;
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

      /* 1 – nome/descrição via API */
      const patchBody = buildPatchCategoryBody(
        {
          categoryName: category.categoryName,
          categoryDescription: category.categoryDescription ?? "",
        },
        {
          categoryName: data.categoryName,
          categoryDescription: data.categoryDescription ?? "",
        }
      );

      const patchResult = await patchCategory(category.id, jwtToken, patchBody);

      if (patchResult.kind === "unauthorized") {
        onOpenChange(false);
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }

      if (patchResult.kind !== "ok") {
        // TODO (contract): exibir `message` do corpo em 4xx quando a API padronizar.
        setApiError("Não foi possível salvar a categoria. Tente novamente.");
        return;
      }

      /* 2 – diff de objetivos (API) */
      const added = localObjectives.filter((o) => !initialObjectiveIds.current.has(o.id));
      const removed = Array.from(initialObjectiveIds.current).filter(
        (id) => !localObjectives.find((o) => o.id === id)
      );

      for (const o of added) {
        const linkRes = await postCategoryObjective(jwtToken, category.id, o.id);
        if (linkRes.kind === "unauthorized") {
          onOpenChange(false);
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }
        if (linkRes.kind !== "ok") {
          window.alert(`Erro ao associar objetivo à categoria: id do Objetivo ${o.id}`);
          // TODO (contract): PATCH já pode ter persistido — refetch da categoria ou transação no back.
          return;
        }
      }

      for (const idObj of removed) {
        const unlinkRes = await deleteCategoryObjective(jwtToken, category.id, idObj);
        if (unlinkRes.kind === "unauthorized") {
          onOpenChange(false);
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }
        if (unlinkRes.kind !== "ok") {
          // TODO (contract): mesmo texto foi especificado para POST e DELETE — alinhar cópia (“remover”) com o produto.
          window.alert(`Erro ao associar objetivo à categoria: id do Objetivo ${idObj}`);
          // TODO (contract): vínculos parcialmente alterados no servidor — refetch ou compensação.
          return;
        }
      }

      onSaved({
        id: category.id,
        categoryName: patchBody.categoryName,
        categoryDescription: patchBody.categoryDescription,
        objectives: localObjectives,
      });
      onOpenChange(false);
    } catch {
      setApiError("Falha de conexão. Verifique sua internet.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!category) return null;

  const categoryShareSnapshot: Category = {
    id: category.id,
    categoryName: (getValues("categoryName") || category.categoryName).trim() || category.categoryName,
    categoryDescription: (getValues("categoryDescription") ?? category.categoryDescription ?? "").trim(),
    objectives: [...localObjectives],
  };

  return (
    <>
    <CompartilharCategoriaModal
      open={shareOpen}
      onOpenChange={setShareOpen}
      categorySnapshot={categoryShareSnapshot}
    />
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
          aria-describedby="editar-cat-desc"
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
                    Editar categoria
                  </Dialog.Title>
                  <p id="editar-cat-desc" className="mt-0.5 text-sm text-[var(--text-muted)]">
                    Altere nome, descrição e objetivos vinculados.
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
                  <label htmlFor="cat-name" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Nome <span className="text-brand-pink" aria-hidden>*</span>
                  </label>
                  <Input id="cat-name" placeholder="Ex.: Carreira" {...register("categoryName")} />
                  {errors.categoryName && (
                    <p className="mt-1 text-sm text-brand-pink" role="alert">
                      {errors.categoryName.message}
                    </p>
                  )}
                </div>

                {/* ── Descrição ── */}
                <div>
                  <label htmlFor="cat-desc" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Descrição{" "}
                    <span className="text-xs text-[var(--text-muted)]">(opcional)</span>
                  </label>
                  <textarea
                    id="cat-desc"
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
                {loadingObjectives && (
                  <p className="text-xs text-[var(--text-muted)]">Carregando objetivos da categoria…</p>
                )}
                {objectivesLoadError && (
                  <p className="text-sm text-brand-pink" role="alert">
                    {objectivesLoadError}
                  </p>
                )}
                <ObjetivosEditor
                  objectives={localObjectives}
                  onChange={setLocalObjectives}
                  allObjectives={allObjectives}
                  disabled={loadingObjectives}
                />

                <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/[0.06] px-4 py-3">
                  <p className="text-xs text-[var(--text-muted)]">
                    Convide alguém da sua lista de amigos (Ajustes) para ver esta categoria no dashboard após aceitar o
                    link.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full sm:w-auto"
                    onClick={() => setShareOpen(true)}
                  >
                    <ShareIcon className="h-5 w-5" aria-hidden />
                    Compartilhar
                  </Button>
                </div>

                {/* ── Rodapé ── */}
                <div className="flex flex-col gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-brand-pink"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                      Excluir categoria
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Confirmar exclusão?</span>
                      <button
                        type="button"
                        disabled={deleteSubmitting || submitting}
                        onClick={() => void handleConfirmDelete()}
                        className="rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-1.5 font-semibold text-brand-pink hover:bg-brand-pink/20 disabled:opacity-50"
                      >
                        {deleteSubmitting ? "Excluindo…" : "Sim, excluir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-lg px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 sm:ml-auto">
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                        Cancelar
                      </Button>
                    </Dialog.Close>
                    <Button type="submit" className="flex-1 sm:flex-none" disabled={submitting || !canSave}>
                      {submitting ? "Salvando…" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
}
