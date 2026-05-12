"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { LivrosKanbanBoard } from "@/components/features/livros/LivrosKanbanBoard";
import { GlassCard } from "@/components/ui/GlassCard";
import { STORAGE_KEYS, WHATSAPP_RENEWAL_URL } from "@/lib/constants";
import { fetchAllBooksForUser } from "@/lib/books/fetch-books";
import type { Livro } from "@/lib/types/models";
import { cn } from "@/lib/utils";
import { useStarterPlan } from "@/hooks/use-starter-plan";

export default function LivrosPage() {
  const router = useRouter();
  const isStarterPlan = useStarterPlan();
  const authRedirect401Ref = useRef(false);
  const handleUnauthorized = useCallback(() => {
    if (!authRedirect401Ref.current) {
      authRedirect401Ref.current = true;
      router.push("/login");
      window.alert("Você não está logado, por favor faça login novamente.");
    }
  }, [router]);

  const [books, setBooks] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refetchBooks = useCallback(async (): Promise<Livro[] | null> => {
    let jwt = "";
    try {
      jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    if (!jwt) {
      setBooks([]);
      setFetchError(null);
      // TODO (contract): área logada sem token — alinhar com `/login` ou refresh de sessão.
      return null;
    }

    const result = await fetchAllBooksForUser(jwt);

    if (result.kind === "unauthorized") {
      handleUnauthorized();
      setBooks([]);
      return null;
    }

    if (result.kind === "ok") {
      setBooks(result.books);
      setFetchError(null);
      return result.books;
    }

    if (result.kind === "network_error") {
      setFetchError("Sem conexão ou o servidor não respondeu. Tente novamente.");
      // TODO (contract): retry/backoff e mensagem específica por tipo de falha de rede.
      return null;
    }

    if (result.kind === "invalid_body") {
      setFetchError("Resposta inesperada do servidor ao listar livros.");
      // TODO (contract): formato alternativo (wrapper, paginação).
      return null;
    }

    if (result.kind === "http_error") {
      setFetchError(`Não foi possível carregar os livros (HTTP ${result.status}).`);
      // TODO (contract): corpo de erro JSON e códigos adicionais (400, 422, 429, 5xx).
      return null;
    }

    return null;
  }, [handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refetchBooks();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchBooks]);

  if (isStarterPlan) {
    return (
      <div className="mx-auto max-w-2xl pt-4 md:pt-6">
        <h1 className="mb-6 text-2xl font-bold">Livros</h1>
        <GlassCard>
          <div className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:items-start sm:text-start">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/30 to-brand-cyan/20 text-brand-cyan shadow-glow"
              aria-hidden
            >
              <BookOpenIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Funcionalidade não disponível no plano Starter
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                O módulo de <strong className="font-semibold text-[var(--text-primary)]">Livros</strong> não está
                incluído no plano Starter. Faça um upgrade para acompanhar suas leituras, organizar seus livros em um
                kanban e registrar seu progresso.
              </p>
              <a
                href={WHATSAPP_RENEWAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex tap-target items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg dark:from-brand-purple dark:to-brand-pink"
              >
                Fazer upgrade via WhatsApp
              </a>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 md:pt-6">
      <h1 className="text-2xl font-bold">Livros</h1>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Carregando livros…</p>
      ) : fetchError ? (
        <div
          className={cn(
            "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700",
            "dark:text-red-300"
          )}
          role="alert"
        >
          {fetchError}
        </div>
      ) : null}

      {!loading && (
        <LivrosKanbanBoard
          books={books}
          setBooks={setBooks}
          refetchBooks={refetchBooks}
          onUnauthorized={handleUnauthorized}
        />
      )}
    </div>
  );
}
