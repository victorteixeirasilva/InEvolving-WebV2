"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { StaggerList } from "@/features/animations/StaggerList";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchCategoryObjectives } from "@/lib/dashboard/fetch-category-objectives";
import { NovaTarefaModal } from "@/components/features/tarefas/NovaTarefaModal";
import {
  getInviteByToken,
  leaveSharedCategoryAsInvitee,
  loadAcceptedSharedCategories,
} from "@/lib/category-share-storage";
import type { SharedTaskCollaborationMeta } from "@/lib/shared-category-tasks-storage";
import { loadAjustesProfile } from "@/lib/ajustes-storage";
import { cn } from "@/lib/utils";
import type { Category, Objective } from "@/lib/types/models";

/* ─── Circular progress (SVG) ─── */
function CircularProgress({ pct }: { pct: number }) {
  const r = 26;
  const stroke = 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const size = (r + stroke) * 2;

  const color =
    pct >= 1 ? "#34d399" : pct >= 0.5 ? "#00BCD4" : pct > 0 ? "#1976D2" : "#94a3b8";

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      {/* trilha */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-[var(--glass-border)]"
      />
      {/* progresso */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  );
}

/* ─── Análise de rendimento do objetivo ─── */
function ObjectiveAnalysis({ o }: { o: Objective }) {
  const total = o.totNumberTasks ?? 0;
  const done = o.numberTasksDone ?? 0;
  const inProgress = o.numberTasksInProgress ?? 0;
  const toDo = o.numberTasksToDo ?? 0;
  const overdue = o.numberTasksOverdue ?? 0;

  const pct = total > 0 ? done / total : o.statusObjective === "DONE" ? 1 : 0;
  const pctLabel = `${Math.round(pct * 100)}%`;

  const stats = [
    {
      label: "Concluídas",
      value: done,
      icon: CheckCircleIcon,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Em andamento",
      value: inProgress,
      icon: ClockIcon,
      color: "text-brand-cyan",
      bg: "bg-brand-cyan/10",
    },
    {
      label: "A fazer",
      value: toDo,
      icon: QueueListIcon,
      color: "text-brand-blue",
      bg: "bg-brand-blue/10",
    },
    ...(overdue > 0
      ? [
          {
            label: "Atrasadas",
            value: overdue,
            icon: ExclamationTriangleIcon,
            color: "text-brand-pink",
            bg: "bg-brand-pink/10",
          },
        ]
      : []),
  ];

  return (
    <div className="mt-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
      {/* progresso geral */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <CircularProgress pct={pct} />
          <span
            className={cn(
              "absolute text-[11px] font-bold tabular-nums",
              pct >= 1 ? "text-emerald-400" : "text-[var(--text-primary)]"
            )}
            style={{ transform: "rotate(90deg)" }}
          >
            {pctLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {pct >= 1
              ? "Objetivo concluído!"
              : pct > 0
              ? "Em progresso"
              : "Não iniciado"}
          </p>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {done} de {total} tarefa{total !== 1 ? "s" : ""} concluída{done !== 1 ? "s" : ""}
            </p>
          )}

          {/* barra de progresso segmentada */}
          {total > 0 && (
            <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
              {done > 0 && (
                <div
                  className="h-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              )}
              {inProgress > 0 && (
                <div
                  className="h-full bg-brand-cyan transition-all duration-700"
                  style={{ width: `${(inProgress / total) * 100}%` }}
                />
              )}
              {overdue > 0 && (
                <div
                  className="h-full bg-brand-pink transition-all duration-700"
                  style={{ width: `${(overdue / total) * 100}%` }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* stats pills */}
      {total > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold",
                s.bg,
                s.color
              )}
            >
              <s.icon className="h-3 w-3" aria-hidden />
              {s.value} {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Placeholder animado enquanto GET `/auth/api/dashboard/category/objectives/…` carrega (categoria própria). */
function CategoryObjectivesLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 shadow-glass backdrop-blur-glass">
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-cyan/25 border-t-brand-cyan"
          aria-hidden
        />
        <p className="text-sm text-[var(--text-muted)]">Carregando objetivos e detalhes da categoria…</p>
      </div>
      <StaggerList className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <GlassCard key={i} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-6 max-w-[75%] flex-1" />
              <Skeleton className="h-5 w-14 shrink-0 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="min-h-[120px] w-full flex-1" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </GlassCard>
        ))}
      </StaggerList>
    </div>
  );
}

/* ─── Page ─── */
export default function CategoriaPage() {
  const router = useRouter();
  const [cat, setCat] = useState<Category | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showNovaTarefaShared, setShowNovaTarefaShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetailsError(null);

    let initial: Category | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.categoriaAtual);
      if (!raw) {
        router.replace("/dashboard");
        return;
      }
      initial = JSON.parse(raw) as Category;
    } catch {
      router.replace("/dashboard");
      return;
    }

    setCat(initial);

    if (initial.sharedFrom) {
      // TODO (contract): se existir GET para convidado (ex.: id de origem + token), buscar detalhes aqui em vez de só snapshot local.
      return () => {
        cancelled = true;
      };
    }

    setLoadingDetails(true);

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): redirecionar para `/login` ou refresh de token quando a rota exigir autenticação.
        setDetailsError("Sessão não encontrada. Faça login novamente.");
        setLoadingDetails(false);
        return;
      }

      const result = await fetchCategoryObjectives(initial, jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        setLoadingDetails(false);
        return;
      }

      if (result.kind === "ok") {
        setCat(result.category);
        try {
          localStorage.setItem(STORAGE_KEYS.categoriaAtual, JSON.stringify(result.category));
        } catch {
          /* ignore */
        }
      } else {
        // TODO (contract): `http_error` / `network_error` — toast, botão tentar novamente e código HTTP específico (403/404/5xx).
        // TODO (contract): estado parcial: manter snapshot do dashboard vs limpar `categoriaAtual`.
        setDetailsError("Não foi possível carregar os objetivos desta categoria.");
      }

      setLoadingDetails(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const collaborationMeta = useMemo((): SharedTaskCollaborationMeta | null => {
    if (!cat?.sharedFrom || !cat.shareToken) return null;
    let em = loadAjustesProfile().email.trim().toLowerCase();
    try {
      const login = String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim().toLowerCase();
      if (!em) em = login;
    } catch {
      /* ignore */
    }
    if (!em) return null;
    const profile = loadAjustesProfile();
    const inv = getInviteByToken(cat.shareToken);
    if (inv && inv.status === "accepted" && inv.inviteeEmail === em) {
      return {
        sourceCategoryId: inv.categoryId,
        ownerEmail: inv.ownerEmail,
        createdByEmail: em,
        createdByName: profile.name.trim() || undefined,
      };
    }
    /* Fallback: categoria aceita injetada sem registro de convite (ex.: migração antiga). */
    if (!inv) {
      const sid = cat.sharedSourceCategoryId;
      const acc = loadAcceptedSharedCategories().find((x) => x.token === cat.shareToken);
      if (acc && sid != null) {
        return {
          sourceCategoryId: sid,
          ownerEmail: acc.ownerEmail.trim().toLowerCase(),
          createdByEmail: em,
          createdByName: profile.name.trim() || undefined,
        };
      }
    }
    return null;
  }, [cat]);

  if (!cat) {
    return (
      <div className="mx-auto max-w-3xl pt-4">
        <p className="text-[var(--text-muted)]">Carregando categoria…</p>
      </div>
    );
  }

  const openObjective = (o: Objective) => {
    try {
      localStorage.setItem(STORAGE_KEYS.objetivoAtual, JSON.stringify(o));
    } catch {
      /* ignore */
    }
    router.push("/dashboard/categoria/objetivo");
  };

  const viewerEmail = () => {
    const p = loadAjustesProfile().email.trim().toLowerCase();
    try {
      const login = String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim().toLowerCase();
      return p || login;
    } catch {
      return p;
    }
  };

  const handleLeaveShared = () => {
    const token = cat.shareToken;
    if (!token) return;
    if (!window.confirm("Remover esta categoria compartilhada do seu dashboard?")) return;
    const r = leaveSharedCategoryAsInvitee(token, viewerEmail());
    if (!r.ok) {
      window.alert(r.message);
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEYS.categoriaAtual);
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-4 md:pt-6">
      {collaborationMeta && (
        <NovaTarefaModal
          open={showNovaTarefaShared}
          onOpenChange={setShowNovaTarefaShared}
          onCreated={() => {}}
          objectivesForSelect={cat.objectives}
          contextSubtitle={`Categoria compartilhada «${cat.categoryName}». Escolha só entre os objetivos desta categoria. A tarefa aparece em Tarefas para você e para o proprietário.`}
          createCollaborativeOnly
          collaborationMeta={collaborationMeta}
        />
      )}
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-brand-cyan underline-offset-4 transition-colors hover:underline"
        >
          ← Voltar ao dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">
          {cat.categoryName}
        </h1>
        {cat.categoryDescription && (
          <p className="mt-2 text-[var(--text-muted)]">{cat.categoryDescription}</p>
        )}
        {cat.sharedFrom && (
          <p className="mt-2 text-sm font-medium text-brand-cyan">
            Categoria compartilhada · Proprietário:{" "}
            <span className="text-[var(--text-muted)]">
              {cat.sharedFrom.ownerName?.trim() || cat.sharedFrom.ownerEmail}
            </span>
          </p>
        )}
        {cat.sharedFrom && collaborationMeta && cat.objectives.length > 0 && (
          <p className="mt-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/[0.08] px-3 py-2 text-sm text-[var(--text-primary)]">
            <span className="font-semibold text-brand-cyan">Onde criar tarefas:</span> use o botão{" "}
            <span className="font-semibold">«Adicionar tarefa»</span> logo abaixo (fluxo do convidado). O botão geral
            &quot;Nova tarefa&quot; em Tarefas não inclui categorias compartilhadas.
          </p>
        )}
        {cat.sharedFrom && !collaborationMeta && (
          <p className="mt-3 rounded-xl border border-brand-pink/25 bg-brand-pink/[0.06] px-3 py-2 text-sm text-[var(--text-muted)]">
            Para ver o botão de adicionar tarefas, o e-mail em <strong className="text-[var(--text-primary)]">Ajustes</strong>{" "}
            (ou login) precisa ser o mesmo do convite aceito. Na demo Ajuda, use &quot;Perfil: convidado (Ricardo)&quot; para a
            categoria de Paulo.
          </p>
        )}

        {detailsError && (
          <p className="mt-3 rounded-xl border border-brand-pink/35 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink" role="alert">
            {detailsError}
          </p>
        )}
      </div>

      {collaborationMeta && cat.objectives.length > 0 && (
        <GlassCard className="border-brand-cyan/30 bg-brand-cyan/[0.08] shadow-[0_0_0_1px_rgba(0,188,212,0.12)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Adicionar tarefa nesta categoria compartilhada</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Só aparecem objetivos desta categoria. A tarefa fica visível em <strong className="text-[var(--text-primary)]">Tarefas</strong>{" "}
            para você e para o proprietário.
          </p>
          <Button type="button" className="mt-4" onClick={() => setShowNovaTarefaShared(true)}>
            <PlusCircleIcon className="h-5 w-5" aria-hidden />
            Adicionar tarefa
          </Button>
        </GlassCard>
      )}

      {cat.sharedFrom && cat.shareToken && (
        <GlassCard className="border-brand-pink/25 bg-brand-pink/[0.06]">
          <p className="text-sm text-[var(--text-muted)]">
            Esta categoria foi compartilhada com você. Você pode deixar de vê-la no seu dashboard quando quiser.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-brand-pink/40 text-brand-pink hover:bg-brand-pink/10"
            onClick={handleLeaveShared}
          >
            Sair desta categoria compartilhada
          </Button>
        </GlassCard>
      )}

      {loadingDetails && !cat.sharedFrom ? (
        <CategoryObjectivesLoadingSkeleton />
      ) : (
        <>
          {cat.objectives.length === 0 && (
            <GlassCard>
              <p className="text-center text-sm text-[var(--text-muted)]">
                Nenhum objetivo vinculado a esta categoria.
              </p>
            </GlassCard>
          )}

          <StaggerList className="grid gap-4 md:grid-cols-2">
            {cat.objectives.map((o) => (
              <GlassCard key={o.id} className="flex flex-col">
                {/* cabeçalho */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
                    {o.nameObjective}
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      o.statusObjective === "DONE"
                        ? "bg-emerald-400/15 text-emerald-400"
                        : "bg-brand-cyan/15 text-brand-cyan"
                    )}
                  >
                    {o.statusObjective === "DONE" ? "Concluído" : "Em andamento"}
                  </span>
                </div>

                {o.descriptionObjective && (
                  <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">
                    {o.descriptionObjective}
                  </p>
                )}

                {/* análise de rendimento */}
                <ObjectiveAnalysis o={o} />

                {/* ação */}
                <button
                  type="button"
                  onClick={() => openObjective(o)}
                  className="tap-target mt-4 w-full rounded-xl bg-brand-blue/15 py-3 text-sm font-semibold text-brand-cyan transition-all duration-[380ms] hover:shadow-glow"
                >
                  Ver análises completas
                </button>
              </GlassCard>
            ))}
          </StaggerList>
        </>
      )}
    </div>
  );
}
