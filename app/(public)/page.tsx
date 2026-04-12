import { GlowingTitle } from "@/components/ui/GlowingTitle";
import { PrimaryLink } from "@/components/ui/PrimaryLink";
import { AnimatedLink } from "@/components/ui/AnimatedLink";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeInView } from "@/components/layout/ScrollReveal";
import { StaggerList } from "@/features/animations/StaggerList";
import { SpringPulse } from "@/components/ui/SpringPulse";

export default function HomePage() {
  return (
    <div className="relative flex min-h-dvh flex-col px-4 pb-12 pt-10 sm:px-6 md:px-10">
      <FadeInView className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10">
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/logo-svg.svg"
            alt=""
            width={120}
            height={120}
            className="mx-auto mb-6 h-20 w-auto opacity-90 sm:h-24"
          />
          <GlowingTitle>InEvolving</GlowingTitle>
          <p className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2 text-[var(--text-muted)] md:text-lg">
            <SpringPulse />
            <span>
              Objetivos, tarefas, finanças e motivação em um só lugar — com visual futurista e experiência
              mobile-first.
            </span>
          </p>
        </header>

        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GlassCard className="h-full">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard inteligente</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Categorias, vision board e visão consolidada da sua evolução.
            </p>
          </GlassCard>
          <GlassCard className="h-full">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tarefas &amp; hábitos</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Lista, kanban e acompanhamento por dia — do planejamento à execução.
            </p>
          </GlassCard>
          <GlassCard className="h-full sm:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">PWA instalável</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Instale no celular e abra direto da tela inicial, com navegação fluida.
            </p>
          </GlassCard>
        </StaggerList>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <PrimaryLink href="/login" className="w-full min-w-[200px] sm:w-auto">
            Entrar
          </PrimaryLink>
          <PrimaryLink href="/cadastro" variant="outline" className="w-full min-w-[200px] sm:w-auto">
            Criar conta
          </PrimaryLink>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)]">
          <AnimatedLink href="/sobre">Conheça o produto</AnimatedLink>
        </p>
      </FadeInView>
    </div>
  );
}
