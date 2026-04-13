"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LivrosKanbanBoard } from "@/components/features/livros/LivrosKanbanBoard";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchAllBooksForUser } from "@/lib/books/fetch-books";
import type { Livro, LivroStatus } from "@/lib/types/models";
import type { CategoryStatus } from "@/components/features/livros/LivrosKanbanBoard";
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
  const [categoryStates, setCategoryStates] = useState<Record<LivroStatus, CategoryStatus>>({
    PENDENTE_LEITURA: { loading: true, error: null },
    LENDO: { loading: true, error: null },
    LEITURA_FINALIZADA: { loading: true, error: null },
  });

  const refetchBooks = useCallback(async (): Promise<Livro[] | null> => {
    let jwt = "";
    try {
      jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    if (!jwt) {
      setBooks([]);
      setCategoryStates({
        PENDENTE_LEITURA: { loading: false, error: null },
        LENDO: { loading: false, error: null },
        LEITURA_FINALIZADA: { loading: false, error: null },
      });
      return null;
    }

    // Set all to loading
    setCategoryStates({
      PENDENTE_LEITURA: { loading: true, error: null },
      LENDO: { loading: true, error: null },
      LEITURA_FINALIZADA: { loading: true, error: null },
    });

    const result = await fetchAllBooksForUser(jwt);

    const newBooks: Livro[] = [];
    const newStates: Record<LivroStatus, CategoryStatus> = {
      PENDENTE_LEITURA: { loading: true, error: null },
      LENDO: { loading: true, error: null },
      LEITURA_FINALIZADA: { loading: true, error: null },
    };

    const processResult = (
      res: any,
      status: LivroStatus,
      errorMsg: string
    ) => {
      if (res.kind === "unauthorized") {
        handleUnauthorized();
        newStates[status] = { loading: false, error: "Não autorizado" };
      } else if (res.kind === "ok") {
        newBooks.push(...res.books);
        newStates[status] = { loading: false, error: null };
      } else if (res.kind === "network_error") {
        newStates[status] = { loading: false, error: "Erro de conexão" };
      } else if (res.kind === "http_error") {
        newStates[status] = { loading: false, error: `Erro ${res.status}` };
      } else {
        newStates[status] = { loading: false, error: errorMsg };
      }
    };

    processResult(result.todo, "PENDENTE_LEITURA", "Erro ao carregar pendentes");
    processResult(result.progress, "LENDO", "Erro ao carregar em andamento");
    processResult(result.completed, "LEITURA_FINALIZADA", "Erro ao carregar finalizados");

    setBooks(newBooks);
    setCategoryStates(newStates);
    return newBooks;
  }, [handleUnauthorized]);

  useEffect(() => {
    refetchBooks();
  }, [refetchBooks]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 md:pt-6">
      <h1 className="text-2xl font-bold">Livros</h1>

      <LivrosKanbanBoard
        books={books}
        setBooks={setBooks}
        categoryStates={categoryStates}
        refetchBooks={refetchBooks}
        onUnauthorized={handleUnauthorized}
      />
    </div>
  );
}
