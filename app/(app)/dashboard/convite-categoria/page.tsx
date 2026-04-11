"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { acceptCategoryInvite, declineCategoryInvite, getInviteByToken } from "@/lib/category-share-storage";
import { loadAjustesProfile } from "@/lib/ajustes-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

function viewerEmailFromStorage(): string {
  if (typeof window === "undefined") return "";
  const p = loadAjustesProfile().email.trim().toLowerCase();
  let login = "";
  try {
    login = String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim().toLowerCase();
  } catch {
    /* ignore */
  }
  return p || login;
}

function ConviteCategoriaInner() {
  const params = useSearchParams();
  const token = params.get("token")?.trim() ?? "";

  const viewerEmail = useMemo(() => viewerEmailFromStorage(), []);
  const invite = token ? getInviteByToken(token) : null;

  const [done, setDone] = useState<"accept" | "decline" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const expired = invite && new Date(invite.expiresAt).getTime() <= Date.now();

  const handleAccept = () => {
    if (!token) return;
    const r = acceptCategoryInvite(token, viewerEmail);
    if (r.ok) {
      setDone("accept");
      setMsg(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("inevolving:shared-categories-changed"));
      }
    } else {
      setMsg(r.message);
    }
  };

  const handleDecline = () => {
    if (!token) return;
    const r = declineCategoryInvite(token, viewerEmail);
    if (r.ok) {
      setDone("decline");
      setMsg(null);
    } else {
      setMsg(r.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-6 md:pt-10">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Convite de categoria</h1>

      {!token && (
        <GlassCard>
          <p className="text-sm text-[var(--text-muted)]">Link inválido ou incompleto.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Voltar ao dashboard
          </Link>
        </GlassCard>
      )}

      {token && !invite && (
        <GlassCard>
          <p className="text-sm text-[var(--text-muted)]">Não encontramos este convite. Ele pode ter sido removido.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Voltar ao dashboard
          </Link>
        </GlassCard>
      )}

      {invite && invite.status === "revoked" && (
        <GlassCard>
          <p className="text-sm text-[var(--text-muted)]">
            Este compartilhamento foi encerrado pelo proprietário ou você saiu da categoria compartilhada.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Voltar ao dashboard
          </Link>
        </GlassCard>
      )}

      {invite && invite.status !== "revoked" && expired && (
        <GlassCard>
          <p className="text-sm text-brand-pink">Este convite expirou.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Voltar ao dashboard
          </Link>
        </GlassCard>
      )}

      {invite && invite.status !== "revoked" && !expired && invite.status !== "pending" && !done && (
        <GlassCard>
          <p className="text-sm text-[var(--text-muted)]">Este convite já foi processado.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Ir ao dashboard
          </Link>
        </GlassCard>
      )}

      {invite && invite.status !== "revoked" && !expired && invite.status === "pending" && !done && (
        <GlassCard className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-primary)]">{invite.ownerName || invite.ownerEmail}</span> quer
            compartilhar a categoria:
          </p>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_70%,transparent)] p-4">
            <p className="text-lg font-bold text-[var(--text-primary)]">{invite.categorySnapshot.categoryName}</p>
            {invite.categorySnapshot.categoryDescription ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">{invite.categorySnapshot.categoryDescription}</p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {invite.categorySnapshot.objectives.length} objetivo(s) vinculado(s)
            </p>
          </div>
          {!viewerEmail && (
            <p className="text-sm text-brand-pink">
              Configure seu e-mail em <Link href="/ajustes" className="underline">Ajustes</Link> ou faça login com o mesmo
              e-mail do convite para aceitar.
            </p>
          )}
          {viewerEmail && invite.inviteeEmail !== viewerEmail && (
            <p className="text-sm text-brand-pink">
              Você está como <strong>{viewerEmail}</strong>, mas o convite foi enviado para{" "}
              <strong>{invite.inviteeEmail}</strong>.
            </p>
          )}
          {msg && <p className="text-sm text-brand-pink">{msg}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              disabled={!viewerEmail || invite.inviteeEmail !== viewerEmail}
              onClick={handleAccept}
            >
              Aceitar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-brand-pink/40 text-brand-pink hover:bg-brand-pink/10"
              disabled={!viewerEmail || invite.inviteeEmail !== viewerEmail}
              onClick={handleDecline}
            >
              Recusar
            </Button>
          </div>
        </GlassCard>
      )}

      {done === "accept" && (
        <GlassCard className="border-emerald-500/30">
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">Categoria adicionada ao seu dashboard.</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Ela aparece com o selo de compartilhada e o e-mail do proprietário.</p>
          <Link href="/dashboard">
            <Button type="button" className="mt-4">
              Abrir dashboard
            </Button>
          </Link>
        </GlassCard>
      )}

      {done === "decline" && (
        <GlassCard>
          <p className="text-[var(--text-primary)]">Convite recusado.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-cyan hover:underline">
            Voltar ao dashboard
          </Link>
        </GlassCard>
      )}
    </div>
  );
}

export default function ConviteCategoriaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[var(--text-muted)]">Carregando…</p>}>
      <ConviteCategoriaInner />
    </Suspense>
  );
}
