"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, UserMinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { DevSectionNotice } from "@/components/ui/DevSectionNotice";
import { Input } from "@/components/ui/Input";
import {
  buildFullAcceptUrl,
  createCategoryShareInvite,
  listActiveSharesForCategory,
  revokeCategoryShareAsOwner,
} from "@/lib/category-share-storage";
import { loadAjustesProfile, loadAmigos } from "@/lib/ajustes-storage";
import type { Category } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export type CompartilharCategoriaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Snapshot atual da categoria (nome, descrição, objetivos) no momento do compartilhamento. */
  categorySnapshot: Category | null;
};

export function CompartilharCategoriaModal({
  open,
  onOpenChange,
  categorySnapshot,
}: CompartilharCategoriaModalProps) {
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareListTick, setShareListTick] = useState(0);

  const [ownerProfile, setOwnerProfile] = useState({ name: "", email: "" });
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    setOwnerProfile(loadAjustesProfile());
    setShareListTick((t) => t + 1);
  }, [open]);

  const friends = useMemo(() => (open && typeof window !== "undefined" ? loadAmigos() : []), [open]);

  const ownerEmail = ownerProfile.email.trim().toLowerCase();
  const ownerName = ownerProfile.name.trim() || ownerEmail || "Usuário";

  const activeShares = useMemo(() => {
    if (!open || typeof window === "undefined" || !categorySnapshot || !ownerEmail) return [];
    return listActiveSharesForCategory(categorySnapshot.id, ownerEmail);
  }, [open, categorySnapshot, ownerEmail, shareListTick]);

  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => f.email.includes(q));
  }, [friends, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedEmail(null);
      setManualEmail("");
      setSentUrl(null);
      setError(null);
    }
  }, [open]);

  const effectiveInvitee =
    selectedEmail?.trim().toLowerCase() ||
    manualEmail.trim().toLowerCase();

  const handleSend = () => {
    setError(null);
    setSentUrl(null);
    if (!categorySnapshot) {
      setError("Categoria indisponível.");
      return;
    }
    if (!ownerEmail) {
      setError("Defina seu e-mail em Ajustes para enviar convites.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveInvitee)) {
      setError("Selecione um amigo ou informe um e-mail válido.");
      return;
    }
    if (effectiveInvitee === ownerEmail) {
      setError("Não é possível convidar o próprio e-mail.");
      return;
    }

    const { acceptPath } = createCategoryShareInvite({
      category: categorySnapshot,
      ownerEmail,
      ownerName,
      inviteeEmail: effectiveInvitee,
    });
    setSentUrl(buildFullAcceptUrl(acceptPath));
    setShareListTick((t) => t + 1);
  };

  const handleRevokeShare = (token: string, inviteeEmail: string) => {
    setError(null);
    if (
      !window.confirm(
        `Remover o acesso de ${inviteeEmail}? Essa pessoa deixa de ver esta categoria no dashboard (neste ambiente de demonstração, o efeito vale para este navegador).`
      )
    ) {
      return;
    }
    const r = revokeCategoryShareAsOwner(token, ownerEmail);
    if (r.ok) setShareListTick((t) => t + 1);
    else setError(r.message);
  };

  const copyLink = async () => {
    if (!sentUrl) return;
    try {
      await navigator.clipboard.writeText(sentUrl);
    } catch {
      /* ignore */
    }
  };

  if (!categorySnapshot) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[62] bg-navy/55 backdrop-blur-md transition-opacity duration-300",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0 dark:bg-black/65"
          )}
        />
        <Dialog.Content
          className="fixed inset-0 z-[62] flex max-h-dvh items-center justify-center overflow-y-auto p-3 outline-none sm:p-6"
          aria-describedby="share-cat-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease }}
            className={cn(
              "relative w-full max-w-[min(100%,26rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)]",
              "bg-[var(--glass-bg)] p-6 shadow-glass-lg backdrop-blur-glass"
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <Dialog.Title className="text-lg font-bold text-[var(--text-primary)]">Compartilhar categoria</Dialog.Title>
              <Dialog.Close
                type="button"
                className="rounded-xl p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-6 w-6" />
              </Dialog.Close>
            </div>
            <DevSectionNotice
              className="mb-3"
              message="Convites e controle de acessos ainda são simulados neste dispositivo; em breve o fluxo será integrado ao servidor."
            />
            <p id="share-cat-desc" className="text-sm text-[var(--text-muted)]">
              Convite para <span className="font-semibold text-[var(--text-primary)]">{categorySnapshot.categoryName}</span>.
              O convidado receberá um link único (simulação: copie e envie). Validade: 7 dias. Uso único ao aceitar.
            </p>

            {ownerEmail && activeShares.length > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--glass-border)] bg-black/[0.03] p-3 dark:bg-white/[0.04]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Quem tem acesso
                </p>
                <ul className="mt-2 space-y-2">
                  {activeShares.map((inv) => (
                    <li
                      key={inv.token}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{inv.inviteeEmail}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {inv.status === "pending" ? "Convite pendente" : "Aceito — pode ver no dashboard"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeShare(inv.token, inv.inviteeEmail)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-pink/35 bg-brand-pink/10 px-2.5 py-1.5 text-xs font-semibold text-brand-pink transition-colors hover:bg-brand-pink/20"
                      >
                        <UserMinusIcon className="h-4 w-4" aria-hidden />
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-brand-pink" role="alert">
                {error}
              </p>
            )}

            {!sentUrl ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="share-search" className="mb-1 flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                    <MagnifyingGlassIcon className="h-4 w-4 text-brand-cyan" aria-hidden />
                    Buscar amigo por e-mail
                  </label>
                  <Input
                    id="share-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="filtrar lista…"
                    className="py-2.5"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Amigos na plataforma</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--glass-border)] p-2">
                    {filteredFriends.length === 0 ? (
                      <li className="px-2 py-3 text-center text-sm text-[var(--text-muted)]">
                        Nenhum amigo encontrado. Adicione em Ajustes ou use o e-mail abaixo.
                      </li>
                    ) : (
                      filteredFriends.map((f) => (
                        <li key={f.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmail(f.email);
                              setManualEmail("");
                            }}
                            className={cn(
                              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              selectedEmail === f.email
                                ? "bg-brand-cyan/15 font-medium text-brand-cyan"
                                : "text-[var(--text-primary)] hover:bg-white/5"
                            )}
                          >
                            {f.email}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <label htmlFor="share-manual" className="mb-1 block text-xs font-medium text-[var(--text-primary)]">
                    Ou digite o e-mail do convidado
                  </label>
                  <Input
                    id="share-manual"
                    type="email"
                    value={manualEmail}
                    onChange={(e) => {
                      setManualEmail(e.target.value);
                      setSelectedEmail(null);
                    }}
                    placeholder="convidado@email.com"
                    className="py-2.5"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                  </Dialog.Close>
                  <Button type="button" className="flex-1" onClick={handleSend}>
                    Gerar convite
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  Convite criado. Em produção, um e-mail seria enviado automaticamente. Por ora, copie o link e envie ao
                  convidado.
                </p>
                <div className="break-all rounded-xl bg-black/5 px-3 py-2 font-mono text-xs text-[var(--text-primary)] dark:bg-white/10">
                  {sentUrl}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={copyLink}>
                    Copiar link
                  </Button>
                  <Button type="button" onClick={() => onOpenChange(false)}>
                    Concluir
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
