"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MotivacaoSonhosSection } from "@/components/features/motivacao/MotivacaoSonhosSection";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchDreamsUser } from "@/lib/motivation/fetch-dreams-user";
import type { Sonho } from "@/lib/types/models";
import { cn } from "@/lib/utils";

export default function MotivacaoPage() {
  const router = useRouter();
  const authRedirect401Ref = useRef(false);
  const handleUnauthorized = useCallback(() => {
    if (!authRedirect401Ref.current) {
      authRedirect401Ref.current = true;
      router.push("/login");
      window.alert("Você não está logado, por favor faça login novamente.");
    }
  }, [router]);

  const [sonhos, setSonhos] = useState<Sonho[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refetchSonhos = useCallback(async (): Promise<Sonho[] | null> => {
    let jwt = "";
    try {
      jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    if (!jwt) {
      setSonhos([]);
      setFetchError(null);
      // TODO (contract): área logada sem token — alinhar com `/login` ou refresh de sessão.
      return null;
    }

    const result = await fetchDreamsUser(jwt);

    if (result.kind === "unauthorized") {
      handleUnauthorized();
      setSonhos([]);
      return null;
    }

    if (result.kind === "ok") {
      setSonhos(result.dreams);
      setFetchError(null);
      return result.dreams;
    }

    if (result.kind === "network_error") {
      setFetchError("Sem conexão ou o servidor não respondeu. Tente novamente.");
      // TODO (contract): retry/backoff.
      return null;
    }

    if (result.kind === "invalid_body") {
      setFetchError("Resposta inesperada do servidor ao listar sonhos.");
      // TODO (contract): formato alternativo (wrapper, paginação).
      return null;
    }

    if (result.kind === "http_error") {
      setFetchError(`Não foi possível carregar os sonhos (HTTP ${result.status}).`);
      // TODO (contract): corpo de erro JSON.
      return null;
    }

    return null;
  }, [handleUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refetchSonhos();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchSonhos]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-4 md:pt-6">
      <h1 className="text-2xl font-bold">Motivação</h1>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Carregando sonhos…</p>
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
        <MotivacaoSonhosSection sonhos={sonhos} refetchSonhos={refetchSonhos} onUnauthorized={handleUnauthorized} />
      )}
    </div>
  );
}
