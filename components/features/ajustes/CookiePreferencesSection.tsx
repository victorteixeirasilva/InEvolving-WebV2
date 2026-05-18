"use client";

import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCookieConsentStore } from "@/stores/cookie-consent-store";

export function CookiePreferencesSection() {
  const analytics = useCookieConsentStore((s) => s.analytics);
  const acceptAnalytics = useCookieConsentStore((s) => s.acceptAnalytics);
  const rejectAnalytics = useCookieConsentStore((s) => s.rejectAnalytics);

  const statusLabel =
    analytics === "granted"
      ? "Cookies de análise ativos"
      : analytics === "denied"
        ? "Cookies de análise desativados"
        : "Aguardando sua escolha no banner";

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-6 w-6 text-brand-cyan" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Privacidade e cookies</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Controle o uso de cookies de análise (Google Analytics). Cookies essenciais do app continuam necessários para
        login e funcionamento.{" "}
        <Link href="/privacidade" className="text-brand-cyan underline-offset-2 hover:underline">
          Política de Privacidade
        </Link>
      </p>
      <p className="text-sm font-medium text-[var(--text-primary)]" role="status">
        {statusLabel}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={rejectAnalytics}>
          Desativar análise
        </Button>
        <Button type="button" className="w-full sm:w-auto" onClick={acceptAnalytics}>
          Ativar análise
        </Button>
      </div>
    </GlassCard>
  );
}
