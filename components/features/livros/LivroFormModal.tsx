"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Input } from "@/components/ui/Input";
import type { Livro, LivroStatus } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_OPTIONS: { value: LivroStatus; label: string }[] = [
  { value: "PENDENTE_LEITURA", label: "Pendente leitura" },
  { value: "LENDO", label: "Lendo" },
  { value: "LEITURA_FINALIZADA", label: "Leitura finalizada" },
];

export type LivroFormSavePayload = {
  id?: number | string;
  title: string;
  author: string;
  theme: string;
  coverImage?: string;
  status: LivroStatus;
};

export type LivroFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBook: Livro | null;
  onSave: (payload: LivroFormSavePayload) => void | Promise<void>;
};

export function LivroFormModal({ open, onOpenChange, editingBook, onSave }: LivroFormModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [theme, setTheme] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<LivroStatus>("PENDENTE_LEITURA");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = editingBook != null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingBook) {
      setTitle(editingBook.title);
      setAuthor(editingBook.author);
      setTheme(editingBook.theme);
      setCoverUrl(editingBook.coverImage ?? "");
      setStatus(editingBook.status);
    } else {
      setTitle("");
      setAuthor("");
      setTheme("");
      setCoverUrl("");
      setStatus("PENDENTE_LEITURA");
    }
  }, [open, editingBook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !theme.trim()) {
      setError("Preencha título, autor e tema.");
      return;
    }
    const trimmed = coverUrl.trim();
    setSaving(true);
    setError(null);
    try {
      await Promise.resolve(
        onSave({
          id: editingBook?.id,
          title: title.trim(),
          author: author.trim(),
          theme: theme.trim(),
          coverImage: trimmed.length > 0 ? trimmed : undefined,
          status,
        })
      );
      onOpenChange(false);
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
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
          aria-describedby="livro-form-desc"
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
                {isEdit ? "Editar livro" : "Novo livro"}
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
              {/* <p id="livro-form-desc" className="text-sm text-[var(--text-muted)]">
                Título, autor, tema e URL da capa. A lista é salva neste dispositivo até a API de livros existir.
              </p> */}
              <div>
                <label htmlFor="livro-title" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Título
                </label>
                <Input
                  id="livro-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="py-2.5"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="livro-author" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Autor
                </label>
                <Input
                  id="livro-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="py-2.5"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="livro-theme" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Tema
                </label>
                <Input
                  id="livro-theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="py-2.5"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="livro-cover" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  URL da imagem de capa
                </label>
                <Input
                  id="livro-cover"
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="py-2.5"
                  placeholder="https://… ou /caminho/em/public"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="livro-status" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                  Status no Kanban
                </label>
                <GlassSelect
                  id="livro-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LivroStatus)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </GlassSelect>
              </div>
              {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={saving}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
