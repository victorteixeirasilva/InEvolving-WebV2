"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SparklesIcon, PencilSquareIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { DevSectionNotice } from "@/components/ui/DevSectionNotice";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { StaggerList } from "@/features/animations/StaggerList";
import { FadeInView, ParallaxSection } from "@/components/layout/ScrollReveal";
import { EditarCategoriaModal } from "@/components/features/dashboard/EditarCategoriaModal";
import { NovaCategoriaModal } from "@/components/features/dashboard/NovaCategoriaModal";
import { leaveSharedCategoryAsInvitee, loadAcceptedSharedCategories } from "@/lib/category-share-storage";
import { loadAjustesProfile } from "@/lib/ajustes-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchDashboardCategories } from "@/lib/dashboard/fetch-dashboard-categories";
import { fetchVisionBoardGenerate } from "@/lib/motivation/fetch-vision-board-generate";
import { hasVisionBoardPreview } from "@/lib/vision-board";
import type { Category, ResponseDashboard } from "@/lib/types/models";

export default function DashboardPage() {
  const router = useRouter();
  const didRedirect401Ref = useRef(false);

  const redirectToLoginUnauthorized = useCallback(() => {
    if (didRedirect401Ref.current) return;
    didRedirect401Ref.current = true;
    router.push("/login");
    window.alert("Você não está logado, por favor faça login novamente.");
  }, [router]);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [sharedCategoriesTick, setSharedCategoriesTick] = useState(0);
  const [carregandoDash, setCarregandoDash] = useState(true);
  const [dashboardData, setDashboardData] = useState<ResponseDashboard | null>(null);
  const [dashFetchError, setDashFetchError] = useState(false);
  const [carregandoVision, setCarregandoVision] = useState(true);
  /** `undefined` = ainda não houve resposta da API de generate; após resposta, prioriza sobre `data.urlVisionBord`. */
  const [urlVisionBordApi, setUrlVisionBordApi] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const onSharedChanged = () => setSharedCategoriesTick((t) => t + 1);
    window.addEventListener("inevolving:shared-categories-changed", onSharedChanged);
    return () => window.removeEventListener("inevolving:shared-categories-changed", onSharedChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): usuário autenticado na UI sem `token` no storage — redirecionar para `/login` ou renovar sessão silenciosamente.
        setCarregandoDash(false);
        setDashFetchError(true);
        return;
      }

      const result = await fetchDashboardCategories(jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        redirectToLoginUnauthorized();
        setCarregandoDash(false);
        return;
      }

      if (result.kind === "ok") {
        setDashboardData(result.data);
        setDashFetchError(false);
      } else {
        // TODO (contract): `http_error` / `network_error` — toast, retry e eventual estado parcial (cache) conforme política do produto.
        setDashboardData(null);
        setDashFetchError(true);
      }

      setCarregandoDash(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [redirectToLoginUnauthorized]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): usuário autenticado na UI sem `token` no storage — redirecionar para `/login` ou renovar sessão silenciosamente.
        setCarregandoVision(false);
        return;
      }

      const result = await fetchVisionBoardGenerate(jwtToken);
      if (cancelled) return;

      if (result.kind === "unauthorized") {
        redirectToLoginUnauthorized();
        setCarregandoVision(false);
        return;
      }

      if (result.kind === "ok") {
        setUrlVisionBordApi(
          result.urlVisionBord != null && typeof result.urlVisionBord === "string"
            ? result.urlVisionBord
            : null
        );
        if (typeof result.urlVisionBord === "string" && result.urlVisionBord.trim()) {
          try {
            localStorage.setItem(STORAGE_KEYS.urlVisionBord, result.urlVisionBord);
          } catch {
            /* ignore */
          }
        }
      } else {
        // TODO (contract): `http_error` / `network_error` — toast ou mensagem na UI em vez de só fallback no mock; retry manual?
        // TODO (contract): limpar `STORAGE_KEYS.urlVisionBord` quando a API indicar vision inválido ou revogado.
      }

      setCarregandoVision(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [redirectToLoginUnauthorized]);

  const categoryList = useMemo(() => {
    if (!dashboardData) return [];
    const shared = loadAcceptedSharedCategories().map((x) => x.category);
    return [...dashboardData.categoryDTOList, ...shared];
  }, [dashboardData, sharedCategoriesTick]);

  const openCategory = (c: Category) => {
    try {
      localStorage.setItem(STORAGE_KEYS.categoriaAtual, JSON.stringify(c));
    } catch {
      /* ignore */
    }
    router.push("/dashboard/categoria");
  };

  const viewerEmailForShare = () => {
    const p = loadAjustesProfile().email.trim().toLowerCase();
    try {
      const login = String(localStorage.getItem(STORAGE_KEYS.email) ?? "").trim().toLowerCase();
      return p || login;
    } catch {
      return p;
    }
  };

  const handleLeaveSharedCategory = (c: Category) => {
    const token = c.shareToken;
    if (!token) return;
    if (!window.confirm("Remover esta categoria compartilhada do seu dashboard?")) return;
    const r = leaveSharedCategoryAsInvitee(token, viewerEmailForShare());
    if (!r.ok) window.alert(r.message);
  };

  const handleCategorySaved = (
    updated: Pick<Category, "id" | "categoryName" | "categoryDescription" | "objectives">
  ) => {
    setDashboardData((old) => {
      if (!old) return old;
      return {
        ...old,
        categoryDTOList: old.categoryDTOList.map((c) =>
          c.id === updated.id
            ? {
                ...c,
                categoryName: updated.categoryName,
                categoryDescription: updated.categoryDescription,
                objectives: updated.objectives,
              }
            : c
        ),
      };
    });
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setDashboardData((old) => {
      if (!old) return old;
      return {
        ...old,
        categoryDTOList: [...old.categoryDTOList, newCategory],
      };
    });
  };

  const handleCategoryDeleted = (categoryId: string) => {
    setDashboardData((old) => {
      if (!old) return old;
      return {
        ...old,
        categoryDTOList: old.categoryDTOList.filter((c) => c.id !== categoryId),
      };
    });
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.categoriaAtual);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Category;
      if (parsed?.id === categoryId) {
        localStorage.removeItem(STORAGE_KEYS.categoriaAtual);
      }
    } catch {
      /* ignore */
    }
  };

  const resolvedVisionUrl =
    urlVisionBordApi !== undefined ? urlVisionBordApi : (dashboardData?.urlVisionBord ?? null);
  const showVisionPreview = hasVisionBoardPreview(resolvedVisionUrl);

  return (
    <>
      <EditarCategoriaModal
        open={editingCategory !== null}
        category={editingCategory}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
        onSaved={handleCategorySaved}
        onDeleted={handleCategoryDeleted}
      />
      <NovaCategoriaModal
        open={showNovaCategoria}
        onOpenChange={setShowNovaCategoria}
        onCreated={handleCategoryCreated}
      />

      <div className="mx-auto max-w-6xl space-y-8 pt-4 md:pt-6">
        <FadeInView>
          <ParallaxSection>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Dashboard</h1>
                {/* <p className="mt-2 text-[var(--text-muted)]">
                  Dados via{" "}
                  <code className="rounded bg-black/5 px-1 text-xs dark:bg-white/10">GET /api/mock/dashboard</code>{" "}
                  (substituir por{" "}
                  <code className="rounded px-1 text-xs">/auth/api/dashboard/categories</code> na fase 2).
                </p> */}
              </div>
              <button
                type="button"
                onClick={() => setShowNovaCategoria(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg active:scale-95 dark:from-brand-purple dark:to-brand-pink"
              >
                <PlusCircleIcon className="h-5 w-5" aria-hidden />
                Nova categoria
              </button>
            </div>
            <DevSectionNotice
              className="mt-4"
              message="Compartilhar categoria, convites por link e categorias recebidas de outros usuários ainda estão em evolução; o fluxo pode mudar com a integração ao servidor."
            />
          </ParallaxSection>
        </FadeInView>

        {(carregandoDash || carregandoVision) && (
          <Skeleton className="aspect-[21/9] min-h-[140px] w-full max-w-full rounded-2xl" />
        )}

        {!carregandoVision && showVisionPreview && (
          <GlassCard className="overflow-hidden p-0">
            <div className="relative aspect-[21/9] min-h-[140px] w-full bg-gradient-to-br from-brand-blue/20 to-brand-purple/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedVisionUrl as string}
                alt="Vision board"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-navy/40 to-transparent p-4">
                <span className="rounded-lg bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-md">
                  Vision board
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {!carregandoVision && !showVisionPreview && (
          <GlassCard className="border-dashed border-brand-cyan/25">
            <div className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:items-start sm:text-start">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/20 text-brand-cyan shadow-glow"
                aria-hidden
              >
                <SparklesIcon className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Seu vision board ainda não está disponível
                </h2>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  O vision board é montado a partir dos seus sonhos. Cadastre sonhos no módulo{" "}
                  <strong className="font-semibold text-[var(--text-primary)]">Motivação</strong> para gerar o painel e
                  visualizá-lo aqui no dashboard.
                </p>
                <Link
                  href="/motivacao"
                  className="inline-flex tap-target items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg dark:from-brand-purple dark:to-brand-pink"
                >
                  Ir para Motivação
                </Link>
              </div>
            </div>
          </GlassCard>
        )}

        {carregandoDash && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        )}

        {!carregandoDash && dashFetchError && (
          <GlassCard>
            <p className="text-brand-pink">Não foi possível carregar as categorias.</p>
            {/* TODO (contract): diferenciar erro de rede, 5xx e 403/404 com mensagens e ação (tentar de novo). */}
          </GlassCard>
        )}

        {!carregandoDash && dashboardData && categoryList.length === 0 && (
          <GlassCard>
            <p className="text-[var(--text-muted)]">
              Nenhuma categoria. Crie em{" "}
              <Link href="/objetivos" className="text-brand-cyan underline-offset-4 hover:underline">
                Objetivos
              </Link>
              .
            </p>
          </GlassCard>
        )}

        {!carregandoDash && dashboardData && categoryList.length > 0 && (
          <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryList.map((c) => (
              <GlassCard key={c.id} className="flex flex-col">
                {/* cabeçalho com badge de objetivos + botão de editar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
                      {c.categoryName}
                    </h2>
                    {c.sharedFrom && (
                      <p className="text-xs font-medium text-brand-cyan">
                        Compartilhada · Proprietário:{" "}
                        <span className="text-[var(--text-muted)]">
                          {c.sharedFrom.ownerName?.trim() || c.sharedFrom.ownerEmail}
                        </span>
                      </p>
                    )}
                  </div>
                  {!c.sharedFrom && (
                    <button
                      type="button"
                      aria-label={`Editar categoria ${c.categoryName}`}
                      onClick={() => setEditingCategory(c)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all duration-[380ms] hover:bg-brand-blue/10 hover:text-brand-cyan"
                    >
                      <PencilSquareIcon className="h-5 w-5" aria-hidden />
                    </button>
                  )}
                </div>

                <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--text-muted)]">
                  {c.categoryDescription}
                </p>

                {/* <p className="mt-4 text-xs text-[var(--text-muted)]">
                  {c.objectives.length} objetivo(s)
                </p> */}

                {c.sharedFrom && (
                  <p className="mt-2 text-[11px] leading-relaxed text-brand-cyan/90">
                    <span className="font-semibold">Tarefas (convidado):</span> abra os detalhes desta categoria — o botão
                    &quot;Adicionar tarefa&quot; fica no topo da página (não use só &quot;Nova tarefa&quot; em Tarefas).
                  </p>
                )}

                {c.sharedFrom && c.shareToken && (
                  <button
                    type="button"
                    onClick={() => handleLeaveSharedCategory(c)}
                    className="tap-target mt-3 w-full rounded-xl border border-brand-pink/35 bg-brand-pink/10 py-2.5 text-xs font-semibold text-brand-pink transition-all duration-[380ms] hover:bg-brand-pink/20"
                  >
                    Sair desta categoria compartilhada
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openCategory(c)}
                  className="tap-target mt-4 w-full rounded-xl border border-[var(--glass-border)] bg-brand-blue/10 py-3 text-sm font-semibold text-brand-cyan transition-all duration-[380ms] hover:border-brand-cyan/50 hover:shadow-glow"
                >
                  {c.sharedFrom ? "Abrir categoria (adicionar tarefas aqui)" : "Ver detalhes da categoria"}
                </button>
              </GlassCard>
            ))}
          </StaggerList>
        )}
      </div>
    </>
  );
}
