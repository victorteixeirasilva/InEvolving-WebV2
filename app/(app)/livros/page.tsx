"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LivrosKanbanBoard } from "@/components/features/livros/LivrosKanbanBoard";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchAllBooksForUser } from "@/lib/books/fetch-books";
import type { Livro } from "@/lib/types/models";
import { cn } from "@/lib/utils";

export default function LivrosPage() {
  const router = useRouter();
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
