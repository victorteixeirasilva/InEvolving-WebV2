"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Sonho } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export type SonhoFormSavePayload = {
  id?: number | string;
  name: string;
  description: string;
  urlImage?: string;
};

export type SonhoFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSonho: Sonho | null;
  onSave: (payload: SonhoFormSavePayload) => void | Promise<void>;
  onDelete?: (id: string | number) => void | Promise<void>;
};

export function SonhoFormModal({
  open,
  onOpenChange,
  editingSonho,
  onSave,
  onDelete,
}: SonhoFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = editingSonho != null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingSonho) {
      setName(editingSonho.name);
      setDescription(editingSonho.description);
      setImageUrl(editingSonho.urlImage ?? "");
    } else {
      setName("");
      setDescription("");
      setImageUrl("");
    }
  }, [open, editingSonho]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Preencha o nome e a descrição do sonho.");
      return;
    }
    const trimmed = imageUrl.trim();
    setSaving(true);
    setError(null);
    try {
      await Promise.resolve(
        onSave({
          id: editingSonho?.id,
          name: name.trim(),
          description: description.trim(),
          urlImage: trimmed.length > 0 ? trimmed : undefined,
        })
      );
      onOpenChange(false);
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSonho || !onDelete) return;
    if (typeof window !== "undefined" && !window.confirm("Remover este sonho permanentemente?")) return;
    setDeleting(true);
    setError(null);
    try {
      await Promise.resolve(onDelete(editingSonho.id));
      onOpenChange(false);
    } catch {
      setError("Não foi possível excluir. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[75] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[75] flex max-h-dvh items-start justify-center overflow-y-auto p-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:p-6"
          aria-describedby="sonho-form-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className={cn(
              "my-auto w-full max-w-[min(100%,26rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[color-mix(in_srgb,var(--glass-bg)_78%,transparent)] shadow-glass-lg backdrop-blur-xl"
            )}
          >
            <div className="h-1 w-full bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-pink" />
            <div className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] p-4 sm:p-5">
              <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">
                {isEdit ? "Editar sonho" : "Novo sonho"}
              </Dialog.Title>
              <Dialog.Close
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
              {/* <p id="sonho-form-desc" className="text-sm text-[var(--text-muted)]">
                Nome, descrição e URL da imagem. Os dados ficam neste dispositivo até a API de motivação estar disponível.
              </p> */}
              <div>
                <label htmlFor="sonho-name" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Nome do sonho
                </label>
                <Input
                  id="sonho-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="py-2.5"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="sonho-desc" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Descrição
                </label>
                <textarea
                  id="sonho-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={cn(
                    "w-full resize-y rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_85%,transparent)]",
                    "px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "outline-none transition focus-visible:border-brand-cyan/50 focus-visible:ring-2 focus-visible:ring-brand-cyan/25"
                  )}
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="sonho-image" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  URL da imagem do sonho
                </label>
                <Input
                  id="sonho-image"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="py-2.5"
                  placeholder="https://… ou /caminho/em/public"
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex flex-col gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                {isEdit && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="order-2 w-full border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400 sm:order-1 sm:w-auto"
                    disabled={saving || deleting}
                    onClick={() => void handleDelete()}
                  >
                    {deleting ? "Excluindo…" : "Excluir sonho"}
                  </Button>
                ) : (
                  <span className="hidden sm:block sm:flex-1" />
                )}
                <div className="flex flex-col-reverse gap-2 sm:order-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={saving || deleting}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={saving || deleting}>
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
