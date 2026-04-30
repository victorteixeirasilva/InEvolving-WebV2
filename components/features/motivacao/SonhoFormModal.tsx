"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon, LinkIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Sonho } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.75;
const MAX_FILE_MB = 5;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas não disponível."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível processar a imagem."));
    };

    img.src = objectUrl;
  });
}

type ImageMode = "url" | "upload";

function isDataUri(value: string): boolean {
  return value.startsWith("data:");
}

function resolveInitialMode(urlImage?: string): ImageMode {
  if (urlImage && isDataUri(urlImage)) return "upload";
  return "url";
}

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
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = editingSonho != null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploadError(null);
    if (editingSonho) {
      setName(editingSonho.name);
      setDescription(editingSonho.description);
      const existing = editingSonho.urlImage ?? "";
      if (existing && isDataUri(existing)) {
        setImageMode("upload");
        setImageBase64(existing);
        setImageFileName("imagem salva");
        setImageUrl("");
      } else {
        setImageMode(resolveInitialMode(existing));
        setImageUrl(existing);
        setImageBase64(null);
        setImageFileName(null);
      }
    } else {
      setName("");
      setDescription("");
      setImageMode("url");
      setImageUrl("");
      setImageBase64(null);
      setImageFileName(null);
    }
  }, [open, editingSonho]);

  const handleModeChange = (mode: ImageMode) => {
    setImageMode(mode);
    setUploadError(null);
    if (mode === "url") {
      setImageBase64(null);
      setImageFileName(null);
    } else {
      setImageUrl("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`A imagem deve ter no máximo ${MAX_FILE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setImageFileName(file.name);
    setCompressing(true);

    try {
      const compressed = await compressImage(file);
      setImageBase64(compressed);
    } catch {
      setUploadError("Não foi possível processar a imagem. Tente outro arquivo.");
      setImageFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setCompressing(false);
    }
  };

  const handleClearImage = () => {
    setImageBase64(null);
    setImageFileName(null);
    setUploadError(null);
    setCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resolveImageValue = (): string | undefined => {
    if (imageMode === "upload") {
      return imageBase64 ?? undefined;
    }
    const trimmed = imageUrl.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const previewSrc = imageMode === "upload" ? (imageBase64 ?? undefined) : (imageUrl.trim() || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Preencha o nome e a descrição do sonho.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await Promise.resolve(
        onSave({
          id: editingSonho?.id,
          name: name.trim(),
          description: description.trim(),
          urlImage: resolveImageValue(),
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

              {/* Image section */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-[var(--text-primary)]">Imagem do sonho</p>

                {/* Mode toggle */}
                <div className="flex rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_60%,transparent)] p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("url")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      imageMode === "url"
                        ? "bg-brand-cyan/15 text-brand-cyan shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <LinkIcon className="h-3.5 w-3.5" aria-hidden />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("upload")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      imageMode === "upload"
                        ? "bg-brand-cyan/15 text-brand-cyan shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <ArrowUpTrayIcon className="h-3.5 w-3.5" aria-hidden />
                    Upload
                  </button>
                </div>

                {/* URL input */}
                {imageMode === "url" && (
                  <Input
                    id="sonho-image"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="py-2.5"
                    placeholder="https://… ou /caminho/em/public"
                    autoComplete="off"
                  />
                )}

                {/* Upload input */}
                {imageMode === "upload" && (
                  <div className="space-y-2">
                    {compressing ? (
                      <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_85%,transparent)] px-3 py-2">
                        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent" aria-hidden />
                        <span className="text-xs text-[var(--text-muted)]">Comprimindo imagem…</span>
                      </div>
                    ) : imageBase64 ? (
                      <div className="flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_85%,transparent)] px-3 py-2">
                        <PhotoIcon className="h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-primary)]">
                          {imageFileName}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="shrink-0 text-[var(--text-muted)] hover:text-red-500"
                          aria-label="Remover imagem"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="sonho-file-upload"
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--glass-border)]",
                          "bg-[color-mix(in_srgb,var(--glass-bg)_60%,transparent)] px-4 py-5 text-center",
                          "transition hover:border-brand-cyan/50 hover:bg-brand-cyan/5"
                        )}
                      >
                        <ArrowUpTrayIcon className="h-7 w-7 text-[var(--text-muted)]" aria-hidden />
                        <div>
                          <p className="text-xs font-medium text-[var(--text-primary)]">Clique para escolher</p>
                          <p className="mt-0.5 text-[0.65rem] text-[var(--text-muted)]">PNG, JPG, WEBP — até 5 MB</p>
                        </div>
                        <input
                          id="sonho-file-upload"
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => void handleFileChange(e)}
                        />
                      </label>
                    )}
                    {uploadError && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">{uploadError}</p>
                    )}
                  </div>
                )}

                {/* Preview */}
                {previewSrc && (
                  <div className="overflow-hidden rounded-xl border border-[var(--glass-border)] bg-gradient-to-br from-brand-purple/20 to-brand-pink/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt="Pré-visualização"
                      className="max-h-40 w-full object-contain p-3 opacity-95"
                      onError={() => {
                        if (imageMode === "url") setImageUrl("");
                      }}
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
              <div className="flex flex-col gap-2 border-t border-[var(--glass-border)] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                {isEdit && onDelete ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="order-2 w-full border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400 sm:order-1 sm:w-auto"
                    disabled={saving || deleting || compressing}
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
                    disabled={saving || deleting || compressing}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={saving || deleting || compressing}>
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
