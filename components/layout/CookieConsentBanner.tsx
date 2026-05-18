"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useCookieConsentStore } from "@/stores/cookie-consent-store";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const analytics = useCookieConsentStore((s) => s.analytics);
  const acceptAnalytics = useCookieConsentStore((s) => s.acceptAnalytics);
  const rejectAnalytics = useCookieConsentStore((s) => s.rejectAnalytics);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || analytics !== null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[90] border-t border-[var(--glass-border)]",
        "bg-[color-mix(in_srgb,var(--glass-bg)_92%,transparent)] px-4 py-4 shadow-glass-lg backdrop-blur-xl",
        "pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p id="cookie-consent-title" className="text-sm font-semibold text-[var(--text-primary)]">
            Cookies e privacidade
          </p>
          <p id="cookie-consent-desc" className="text-sm leading-relaxed text-[var(--text-muted)]">
            Usamos cookies essenciais para o funcionamento do app. Com sua permissão, também usamos cookies de
            análise (Google Analytics) para entender como o site é usado e melhorar o produto. Você pode recusar
            sem perder o acesso.{" "}
            <Link href="/privacidade" className="font-medium text-brand-cyan underline-offset-2 hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={rejectAnalytics}>
            Recusar análise
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={acceptAnalytics}>
            Aceitar análise
          </Button>
        </div>
      </div>
    </div>
  );
}
