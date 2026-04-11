import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryLink } from "@/components/ui/PrimaryLink";

export default function DesculpaPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <GlassCard className="text-center">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Em desenvolvimento</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Esta rota substitui fluxos ainda não migrados (ex.: editar objetivo a partir do dashboard).
        </p>
        <PrimaryLink href="/dashboard" className="mt-8 w-full">
          Voltar ao dashboard
        </PrimaryLink>
      </GlassCard>
    </div>
  );
}
