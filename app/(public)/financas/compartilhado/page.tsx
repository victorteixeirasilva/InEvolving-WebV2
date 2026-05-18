"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FinancasPageContent } from "@/components/features/financas/FinancasPageContent";
import {
  applyFinanceShareTokenFromUrl,
  getStoredJwt,
  isFinanceShareSession,
} from "@/lib/finance/finance-share-session";

function FinancasCompartilhadoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

    if (tokenFromUrl) {
      applyFinanceShareTokenFromUrl(tokenFromUrl);
      router.replace("/financas/compartilhado");
      return;
    }

    const jwt = getStoredJwt();
    if (!jwt || !isFinanceShareSession()) {
      setInvalid(true);
      setReady(true);
      return;
    }

    setReady(true);
  }, [searchParams, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-12 text-center text-sm text-[var(--text-muted)]">
        Carregando planejamento compartilhado…
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="mx-auto max-w-lg px-3 py-12 text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Link inválido ou expirado</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Peça um novo link de compartilhamento a quem compartilhou o planejamento com você.
        </p>
      </div>
    );
  }

  return <FinancasPageContent sharedSession />;
}

export default function FinancasCompartilhadoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-3 py-12 text-center text-sm text-[var(--text-muted)]">
          Carregando…
        </div>
      }
    >
      <FinancasCompartilhadoInner />
    </Suspense>
  );
}
