"use client";

import { useEffect } from "react";

async function clearServiceWorkerAndCachesThenReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

/**
 * Erros nas rotas dentro do layout raiz (não substitui `layout.tsx`).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-lg font-bold text-[var(--text-primary)]">Algo deu errado</h1>
      <p className="text-sm text-[var(--text-muted)]">
        Não foi possível exibir esta página. Você pode tentar novamente ou voltar ao início.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar de novo
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
        >
          Ir ao dashboard
        </a>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Se você usa o app instalado (PWA) ou a página repetir o erro após um deploy, limpe o cache do
        site nas configurações do navegador ou use o botão abaixo uma vez.
      </p>
      <button
        type="button"
        onClick={() => void clearServiceWorkerAndCachesThenReload()}
        className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
      >
        Limpar cache do PWA e recarregar
      </button>
    </div>
  );
}
