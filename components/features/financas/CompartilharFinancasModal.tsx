"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LinkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/constants";
import { buildFinanceShareUrl } from "@/lib/finance/build-finance-share-url";

export type CompartilharFinancasModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompartilharFinancasModal({ open, onOpenChange }: CompartilharFinancasModalProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setCopied(false);
    setError(null);
    let jwt = "";
    try {
      jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }
    if (!jwt) {
      setShareUrl(null);
      setError("Faça login para gerar um link de compartilhamento.");
      return;
    }
    setShareUrl(buildFinanceShareUrl(jwt));
  }, [open]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar. Selecione o link abaixo e copie manualmente.");
    }
  }, [shareUrl]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 shadow-glass-lg outline-none">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">
              Compartilhar planejamento
            </Dialog.Title>
            <Dialog.Close
              type="button"
              className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Quem tiver este link acessa seu planejamento financeiro enquanto o link for válido (até sua sessão
            expirar). A pessoa poderá ver saldos e registrar transações, mas não alterar o salário.
          </p>

          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
            Trate o link como uma senha: não envie em grupos públicos. Para invalidar o acesso, faça login novamente e
            gere um novo link após a sessão anterior expirar.
          </p>

          {error && (
            <p className="mt-3 text-sm text-brand-pink" role="alert">
              {error}
            </p>
          )}

          {shareUrl && (
            <div className="mt-4 space-y-3">
              <p className="break-all rounded-lg border border-[var(--glass-border)] bg-black/5 px-3 py-2 font-mono text-xs text-[var(--text-muted)] dark:bg-white/5">
                {shareUrl}
              </p>
              <Button type="button" onClick={() => void copyLink()} className="w-full inline-flex items-center justify-center gap-2">
                <LinkIcon className="h-4 w-4" aria-hidden />
                {copied ? "Link copiado!" : "Copiar link"}
              </Button>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Dialog.Close asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
