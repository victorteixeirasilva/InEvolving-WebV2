import { PrimaryLink } from "@/components/ui/PrimaryLink";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-[var(--page-bg)] px-4"
    >
      <GlassCard className="max-w-md text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Sem conexão</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Você está offline. Verifique a rede e tente novamente. Conteúdo em cache pode continuar disponível conforme a
          estratégia PWA.
        </p>
        <PrimaryLink href="/" className="mt-8 w-full">
          Ir ao início
        </PrimaryLink>
      </GlassCard>
    </div>
  );
}
