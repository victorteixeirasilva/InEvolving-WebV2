"use client";

import { useMemo, useState } from "react";
import {
  InformationCircleIcon,
  PhotoIcon,
  PlusCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { SonhoFormModal, type SonhoFormSavePayload } from "@/components/features/motivacao/SonhoFormModal";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StaggerList } from "@/features/animations/StaggerList";
import { deleteDream } from "@/lib/motivation/delete-dream";
import { patchDream } from "@/lib/motivation/patch-dream";
import { postDream } from "@/lib/motivation/post-dream";
import { sonhoMotivacaoInsight } from "@/lib/motivacao-sonhos-messages";
import { STORAGE_KEYS } from "@/lib/constants";
import type { Sonho } from "@/lib/types/models";
import { cn } from "@/lib/utils";

function readJwtFromStorage(): string {
  try {
    return String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
  } catch {
    return "";
  }
}

function dreamKey(id: string | number): string {
  return String(id);
}

function DreamImageArea({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(url) && !failed;

  return (
    <div className="relative aspect-video w-full shrink-0 bg-gradient-to-br from-brand-purple/25 to-brand-pink/15">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          className="h-full w-full object-contain p-4 opacity-95"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 px-4 text-center">
          <PhotoIcon className="h-12 w-12 text-[var(--text-muted)]/45" aria-hidden />
          <span className="text-xs text-[var(--text-muted)]">
            {url && failed ? "Não foi possível carregar a imagem" : "Sem imagem — toque para editar"}
          </span>
        </div>
      )}
    </div>
  );
}

export type MotivacaoSonhosSectionProps = {
  sonhos: Sonho[];
  refetchSonhos: () => Promise<Sonho[] | null>;
  onUnauthorized: () => void;
};

export function MotivacaoSonhosSection({ sonhos, refetchSonhos, onUnauthorized }: MotivacaoSonhosSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sonho | null>(null);

  const count = sonhos.length;
  const insight = useMemo(() => sonhoMotivacaoInsight(count), [count]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (s: Sonho) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleSave = async (payload: SonhoFormSavePayload) => {
    const jwt = readJwtFromStorage();
    if (!jwt) {
      throw new Error("Sessão expirada ou token ausente.");
    }

    if (payload.id != null) {
      const r = await patchDream(jwt, {
        id: payload.id,
        name: payload.name,
        description: payload.description,
        urlImage: payload.urlImage,
      });
      if (r.kind === "unauthorized") {
        onUnauthorized();
        throw new Error("Sessão expirada.");
      }
      if (r.kind !== "ok" && r.kind !== "ok_no_body") {
        throw new Error("Não foi possível salvar as alterações do sonho.");
      }
      await refetchSonhos();
      return;
    }

    const r = await postDream(jwt, {
      name: payload.name,
      description: payload.description,
      urlImage: payload.urlImage,
    });
    if (r.kind === "unauthorized") {
      onUnauthorized();
      throw new Error("Sessão expirada.");
    }
    if (r.kind !== "ok" && r.kind !== "ok_no_body") {
      throw new Error("Não foi possível cadastrar o sonho.");
    }
    await refetchSonhos();
  };

  const handleDelete = async (id: string | number) => {
    const jwt = readJwtFromStorage();
    if (!jwt) {
      window.alert("Sessão expirada ou token ausente.");
      return;
    }
    const r = await deleteDream(jwt, id);
    if (r.kind === "unauthorized") {
      onUnauthorized();
      return;
    }
    if (r.kind !== "ok" && r.kind !== "ok_no_body") {
      window.alert("Não foi possível remover o sonho.");
      // TODO (contract): corpo de erro em 404/409.
      return;
    }
    await refetchSonhos();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-base leading-relaxed text-[var(--text-primary)] sm:text-[1.05rem]">
          Acompanhe e organize seus sonhos para que ganhem vida no seu{" "}
          <span className="font-semibold text-brand-cyan">Vision Board</span>. Atualmente você possui{" "}
          <span className="font-bold tabular-nums text-brand-pink">{count}</span>{" "}
          {count === 1 ? "sonho cadastrado" : "sonhos cadastrados"}.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Toque ou clique em um card para editar ou excluir. Use imagens que te inspirem — elas aparecem aqui e podem
          compor seu board.
        </p>
      </div>

      <div
        className={cn(
          "flex gap-3 rounded-2xl border p-4 sm:p-5",
          insight.panelClass
        )}
        role="status"
      >
        <InformationCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-brand-cyan" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold text-[var(--text-primary)]">{insight.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{insight.body}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <SparklesIcon className="h-5 w-5 text-brand-purple" aria-hidden />
          <span>
            Total: <strong className="tabular-nums text-[var(--text-primary)]">{count}</strong>
          </span>
        </div>
        <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={openNew}>
          <PlusCircleIcon className="h-5 w-5" aria-hidden />
          Novo sonho
        </Button>
      </div>

      {count === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <SparklesIcon className="h-14 w-14 text-[var(--text-muted)]/40" aria-hidden />
          <div className="max-w-md space-y-2 px-4">
            <p className="text-lg font-semibold text-[var(--text-primary)]">Nenhum sonho ainda</p>
            <p className="text-sm text-[var(--text-muted)]">
              Cadastre o primeiro com nome, descrição e, se quiser, o link de uma imagem. Assim começamos a te lembrar
              do que importa.
            </p>
          </div>
          <Button type="button" onClick={openNew}>
            <PlusCircleIcon className="h-5 w-5" aria-hidden />
            Adicionar primeiro sonho
          </Button>
        </GlassCard>
      ) : (
        <StaggerList className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-2 sm:gap-y-4">
          {sonhos.map((s) => (
            <button
              key={dreamKey(s.id)}
              type="button"
              aria-label={`Abrir sonho: ${s.name}. Editar ou excluir.`}
              onClick={() => openEdit(s)}
              className={cn(
                "group flex h-full min-h-0 min-w-0 flex-col text-left transition-all duration-200",
                "rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-sm",
                "overflow-hidden outline-none hover:border-brand-cyan/35 hover:shadow-glass-lg",
                "focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
              )}
            >
              <DreamImageArea url={s.urlImage} title={s.name} />
              <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                <h2 className="line-clamp-2 shrink-0 text-base font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-brand-cyan sm:text-lg">
                  {s.name}
                </h2>
                <div className="mt-2 min-h-[4.5rem] flex-1 sm:min-h-[5.25rem]">
                  <p className="line-clamp-4 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">{s.description}</p>
                </div>
                <p className="mt-auto shrink-0 pt-2 text-[0.65rem] font-medium text-brand-purple/90 sm:text-xs">
                  Toque para editar ou excluir
                </p>
              </div>
            </button>
          ))}
        </StaggerList>
      )}

      <SonhoFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editingSonho={editing}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
