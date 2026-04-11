"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_HELP_URL } from "@/lib/constants";

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Ajuda</h1>
      <GlassCard>
        <p className="text-[var(--text-muted)]">
          Fale conosco pelo WhatsApp.
          {/* <code className="rounded bg-black/5 px-1 text-xs dark:bg-white/10">NEXT_PUBLIC_WHATSAPP_URL</code>. */}
        </p>
        <a href={WHATSAPP_HELP_URL} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <Button type="button" className="w-full">
            Abrir WhatsApp
          </Button>
        </a>
      </GlassCard>
    </div>
  );
}
