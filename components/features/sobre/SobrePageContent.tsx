"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { buildWhatsAppMessageUrl } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { PrimaryLink } from "@/components/ui/PrimaryLink";
import { AnimatedLink } from "@/components/ui/AnimatedLink";
import { FadeInView, ParallaxSection } from "@/components/layout/ScrollReveal";
import { StaggerList } from "@/features/animations/StaggerList";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PRODUCT_SHOTS } from "@/components/features/sobre/product-shots";

const waDemo = buildWhatsAppMessageUrl(
  "Olá! Vim pela página do InEvolving e quero conhecer os planos e começar a usar."
);
const waPlanos = buildWhatsAppMessageUrl(
  "Olá! Quero informações sobre planos e valores do InEvolving."
);
const waPlanoMensal = buildWhatsAppMessageUrl(
  "Olá! Quero assinar o InEvolving no plano mensal (R$ 79,99/mês)."
);
const waPlanoAnual = buildWhatsAppMessageUrl(
  "Olá! Quero assinar o InEvolving no plano anual (R$ 59,99/mês cobrado anualmente)."
);
const waOnboarding = buildWhatsAppMessageUrl(
  "Olá! Quero levar o InEvolving para minha equipe ou empresa."
);
const waGeral = buildWhatsAppMessageUrl(
  "Olá! Tenho interesse no InEvolving e gostaria de falar com o time comercial."
);

const MARQUEE_ITEMS = [
  "Dashboard",
  "Categorias",
  "Tarefas",
  "Kanban",
  "Finanças",
  "Livros",
  "Motivação",
  "PWA",
  "Colaboração",
  "Offline parcial",
];

function GridMesh() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2]"
      aria-hidden
      style={{
        backgroundImage: `
          linear-gradient(rgba(25, 118, 210, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(25, 118, 210, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent)",
      }}
    />
  );
}

function WaLink({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline";
}) {
  const base =
    "inline-flex tap-target items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-[380ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow hover:shadow-glass-lg hover:scale-[1.02] dark:shadow-glow-pink/40 dark:from-brand-purple dark:to-brand-pink"
      : "border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-glass text-[var(--text-primary)] hover:border-brand-cyan/50 hover:shadow-glow";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles} ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

function useScrolledPast(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function TiltFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 380, damping: 32 });
  const rotateY = useSpring(ry, { stiffness: 380, damping: 32 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(py * -11);
    ry.set(px * 12);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={
        reduce
          ? undefined
          : {
              rotateX,
              rotateY,
              transformPerspective: 1100,
              transformStyle: "preserve-3d",
            }
      }
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

function ProductShowcase() {
  const reduce = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const shot = PRODUCT_SHOTS[index] ?? PRODUCT_SHOTS[0];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % PRODUCT_SHOTS.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + PRODUCT_SHOTS.length) % PRODUCT_SHOTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <FadeInView className="mb-8 max-w-2xl">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-purple dark:text-brand-pink">
          Interface real
        </h2>
        <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
          O software por dentro — limpo, rápido e consistente
        </p>
        <p className="mt-3 text-[var(--text-muted)]">
          Navegue pelos módulos principais. As artes abaixo refletem o layout e a hierarquia visual do app; você
          pode substituir por capturas de tela em alta resolução na pasta{" "}
          <span className="font-mono text-xs text-brand-cyan">public/sobre/</span>.
        </p>
      </FadeInView>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col lg:flex-nowrap">
          {PRODUCT_SHOTS.map((s, i) => (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors duration-300 ${
                i === index
                  ? "border-brand-cyan/60 bg-brand-blue/10 text-[var(--text-primary)] shadow-glow dark:border-brand-pink/50 dark:bg-brand-purple/15"
                  : "border-[var(--glass-border)] bg-[var(--glass-bg)]/50 text-[var(--text-muted)] hover:border-brand-cyan/35 hover:text-[var(--text-primary)]"
              }`}
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
            >
              <span className="block font-semibold">{s.title}</span>
              <span className="mt-0.5 block text-xs font-normal opacity-80">{s.caption}</span>
            </motion.button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <TiltFrame className="origin-center">
            <div
              className={`relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-gradient-to-br p-1 shadow-glass-lg ${shot.accent}`}
            >
              <div className="overflow-hidden rounded-[14px] bg-[#0a0e14] shadow-inner">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={shot.id}
                    initial={reduce ? false : { opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={reduce ? undefined : { opacity: 0, scale: 1.01, filter: "blur(4px)" }}
                    transition={{ duration: reduce ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative aspect-[960/600] w-full overflow-hidden bg-[#0a0e14]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- SVG/prévias locais: img evita bug do next/image com fill+SVG */}
                    <img
                      src={shot.src}
                      alt=""
                      width={960}
                      height={600}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                      className="pointer-events-none block h-full w-full object-cover object-top"
                    />
                    <span className="sr-only">{shot.caption}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
          </TiltFrame>
          <p className="mt-4 text-center text-xs text-[var(--text-muted)] lg:text-left">
            Dica: use as setas ← → do teclado para alternar as telas.
          </p>
        </div>
      </div>
    </div>
  );
}

function FloatingBadges() {
  const reduce = useReducedMotion();
  const items = [
    { label: "PWA instalável", delay: 0.05 },
    { label: "Sincronização segura", delay: 0.12 },
    { label: "Modo claro e escuro", delay: 0.2 },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2 md:gap-3">
      {items.map((item, i) => (
        <motion.span
          key={item.label}
          className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)]/90 px-3 py-1.5 text-[10px] font-medium text-[var(--text-muted)] shadow-glass backdrop-blur-glass sm:text-xs"
          initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
          animate={
            reduce
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{ delay: 0.35 + item.delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="inline-block"
            animate={reduce ? {} : { y: [0, -5, 0] }}
            transition={
              reduce
                ? {}
                : {
                    duration: 3.2 + i * 0.35,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: 0.6 + i * 0.2,
                  }
            }
          >
            {item.label}
          </motion.span>
        </motion.span>
      ))}
    </div>
  );
}

function MarqueeStrip() {
  const reduce = useReducedMotion();
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative overflow-hidden border-y border-[var(--glass-border)] bg-[var(--glass-bg)]/40 py-3 backdrop-blur-sm">
      <motion.div
        className="flex w-max gap-10 px-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 28, repeat: Infinity, ease: "linear" }
        }
      >
        {doubled.map((label, i) => (
          <span key={`${label}-${i}`} className="flex items-center gap-10 whitespace-nowrap">
            <span className="text-brand-cyan">{label}</span>
            <span className="opacity-30">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function StatsRow() {
  const reduce = useReducedMotion();
  const stats = [
    { value: "6+", label: "módulos integrados" },
    { value: "24/7", label: "acesso na nuvem" },
    { value: "100%", label: "foco mobile-first" },
  ];

  return (
    <motion.div
      className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 border-t border-[var(--glass-border)] pt-10"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">{s.value}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)] sm:text-xs">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}

export function SobrePageContent() {
  const reduce = useReducedMotion();
  const scrolled = useScrolledPast(24);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <motion.header
        className="sticky top-0 z-50 border-b border-[var(--glass-border)] backdrop-blur-glass"
        initial={false}
        animate={{
          boxShadow: scrolled ? "0 12px 40px rgba(0,0,0,0.12)" : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor: scrolled
            ? "color-mix(in srgb, var(--glass-bg) 92%, transparent)"
            : "color-mix(in srgb, var(--glass-bg) 72%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8">
          <motion.div whileHover={reduce ? undefined : { scale: 1.02 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
            <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/logo-svg.svg" alt="" width={40} height={40} className="h-9 w-auto" />
              <span className="font-semibold tracking-tight">InEvolving</span>
            </Link>
          </motion.div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--text-muted)] md:flex">
            {[
              ["#interface", "Telas"],
              ["#produto", "Produto"],
              ["#diferenciais", "Diferenciais"],
              ["#planos", "Planos"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <motion.a
                key={href}
                href={href}
                className="relative"
                whileHover={reduce ? undefined : { y: -1 }}
              >
                <span className="transition-colors hover:text-brand-cyan">{label}</span>
              </motion.a>
            ))}
          </nav>
          <motion.div whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }}>
            <WaLink href={waGeral} className="shrink-0 text-xs sm:text-sm">
              WhatsApp
            </WaLink>
          </motion.div>
        </div>
      </motion.header>

      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 md:px-8 md:pb-28 md:pt-16">
        <motion.div
          className="pointer-events-none absolute left-1/2 top-0 h-[min(520px,70vw)] w-[min(520px,90vw)] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-blue/25 via-brand-cyan/20 to-brand-purple/25 blur-3xl dark:from-brand-purple/30 dark:via-brand-pink/15 dark:to-brand-blue/20"
          aria-hidden
          animate={
            reduce
              ? undefined
              : {
                  scale: [1, 1.06, 1],
                  opacity: [0.85, 1, 0.85],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <GridMesh />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.p
            className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em] text-brand-blue dark:text-brand-cyan"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Disponível para novos usuários · PWA · Nuvem
          </motion.p>
          <motion.h1
            className="text-balance text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl md:leading-[1.1]"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            A plataforma onde{" "}
            <span
              className="bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift dark:from-brand-purple dark:via-brand-pink dark:to-brand-cyan"
              style={{ WebkitBackgroundClip: "text" }}
            >
              estratégia encontra execução
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-pretty text-base text-[var(--text-muted)] sm:text-lg"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            InEvolving está em produção: dashboard, tarefas com kanban, finanças, livros, motivação e categorias
            colaborativas — interface glass, animações fluidas e experiência pensada primeiro para o celular.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <WaLink href={waDemo} className="w-full min-w-[220px] sm:w-auto">
              Quero começar agora
            </WaLink>
            <WaLink href={waPlanos} variant="outline" className="w-full min-w-[220px] sm:w-auto">
              Ver planos no WhatsApp
            </WaLink>
          </motion.div>
          <motion.p
            className="mt-6 text-sm text-[var(--text-muted)]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            Já é cliente?{" "}
            <AnimatedLink href="/login">Entrar</AnimatedLink>
            {" · "}
            <AnimatedLink href="/">Site</AnimatedLink>
          </motion.p>
          <FloatingBadges />
          <StatsRow />
        </div>
      </section>

      <MarqueeStrip />

      <section id="interface" className="scroll-mt-24 px-4 py-16 sm:px-6 md:px-8 md:py-20">
        <ParallaxSection>
          <ProductShowcase />
        </ParallaxSection>
      </section>

      <section id="produto" className="scroll-mt-24 px-4 py-16 sm:px-6 md:px-8">
        <FadeInView className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-purple dark:text-brand-pink">
              Produto
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
              Um cockpit completo para vida e trabalho
            </p>
            <p className="mt-3 text-[var(--text-muted)]">
              Cada módulo conversa com os outros: mesma identidade visual, mesma navegação e a mesma promessa —
              menos atrito, mais clareza.
            </p>
          </div>

          <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <GlassCard className="lg:col-span-2 lg:row-span-1">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard inteligente</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Visão consolidada de categorias, progresso e atalhos — seu ponto de partida todos os dias.
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Tarefas &amp; Kanban</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Lista e quadro visual integrados, com status e prazos que acompanham o ritmo do time.
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Categorias colaborativas</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Compartilhe objetivos com equipe ou família, com permissões e visibilidade sob controle.
              </p>
            </GlassCard>
            <GlassCard className="md:col-span-2">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Finanças</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Entradas, saídas e leitura do período em painéis objetivos — decisão financeira com contexto.
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Livros &amp; aprendizado</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Organize leituras e extraia valor do que você estuda, sem perder o fio da meada.
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Motivação &amp; sonhos</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Metas visuais e sonhos sempre à vista — para lembrar por que a disciplina vale a pena.
              </p>
            </GlassCard>
            <GlassCard className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">PWA instalável</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Instale no celular, use como app nativo, com suporte a uso parcial offline e transições suaves entre
                telas.
              </p>
            </GlassCard>
          </StaggerList>
        </FadeInView>
      </section>

      <section
        id="diferenciais"
        className="scroll-mt-24 border-y border-[var(--glass-border)] bg-black/[0.02] px-4 py-16 dark:bg-white/[0.02] sm:px-6 md:px-8"
      >
        <FadeInView className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-cyan">
              Por que InEvolving
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              Produto maduro, experiência premium
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {[
              {
                step: "01",
                title: "Design system próprio",
                body: "Gradientes de marca, superfícies em vidro e motion com easing liquid — consistência em cada interação.",
              },
              {
                step: "02",
                title: "API e segurança",
                body: "Arquitetura preparada para integrações, autenticação e evolução contínua sem quebrar sua operação.",
              },
              {
                step: "03",
                title: "Execução em foco",
                body: "Um só lugar para planejar, fazer e medir — menos troca de ferramentas, mais resultado.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-glass"
                whileHover={reduce ? undefined : { y: -6, boxShadow: "0 0 32px rgba(0, 188, 212, 0.2)" }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <span className="font-mono text-sm font-bold text-brand-blue dark:text-brand-pink">{item.step}</span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.body}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <WaLink href={waGeral}>Falar com especialista no WhatsApp</WaLink>
          </div>
        </FadeInView>
      </section>

      <section className="px-4 py-16 sm:px-6 md:px-8">
        <FadeInView className="mx-auto max-w-3xl text-center">
          <blockquote className="text-pretty text-lg font-medium leading-relaxed text-[var(--text-primary)] md:text-xl">
            &ldquo;Reduzimos ferramentas espalhadas e ganhamos adesão do time — a interface{' '}
            <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent dark:from-brand-cyan dark:to-brand-pink">
              convida a usar todo dia
            </span>
            .&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            — Coordenação de operações, empresa de serviços (time híbrido)
          </p>
        </FadeInView>
      </section>

      <section id="planos" className="scroll-mt-24 px-4 pb-20 sm:px-6 md:px-8">
        <FadeInView className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-pink dark:text-brand-cyan">
              Planos
            </h2>
            <p className="mt-2 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              Preço transparente — perfis Individual, Time e Empresa no WhatsApp
            </p>
            <p className="mx-auto mt-3 max-w-xl text-[var(--text-muted)]">
              Plano pessoal com valores públicos abaixo. Para equipes e empresas, fechamos condições e volume com o
              time comercial.
            </p>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <motion.div
              className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 shadow-glass backdrop-blur-glass"
              whileHover={reduce ? undefined : { y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-cyan">Mensal</p>
              <p className="mt-2 flex items-baseline gap-1 text-[var(--text-primary)]">
                <span className="text-sm font-medium text-[var(--text-muted)]">R$</span>
                <span className="text-4xl font-extrabold tracking-tight">79,99</span>
                <span className="text-sm text-[var(--text-muted)]">/mês</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                Menos de um café por dia: em média, <strong className="text-[var(--text-primary)]">pouco mais de R$ 2</strong>{" "}
                por dia no mês para se organizar, acompanhar metas e mudar de vida com método.
              </p>
              <WaLink href={waPlanoMensal} className="mt-5 w-full">
                Assinar mensal no WhatsApp
              </WaLink>
            </motion.div>
            <motion.div
              className="rounded-2xl border-2 border-brand-cyan/45 bg-[var(--glass-bg)] p-6 shadow-glow backdrop-blur-glass dark:border-brand-pink/35"
              whileHover={reduce ? undefined : { y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-purple dark:text-brand-pink">
                Anual
              </p>
              <p className="mt-2 flex items-baseline gap-1 text-[var(--text-primary)]">
                <span className="text-sm font-medium text-[var(--text-muted)]">R$</span>
                <span className="text-4xl font-extrabold tracking-tight">59,99</span>
                <span className="text-sm text-[var(--text-muted)]">/mês</span>
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Cobrança anual (12× R$ 59,99 = R$ 719,88/ano).</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                Na média do ano, fica <strong className="text-[var(--text-primary)]">menos de R$ 2 por dia</strong> — o
                melhor custo por resultado para quem quer compromisso de longo prazo.
              </p>
              <WaLink href={waPlanoAnual} className="mt-5 w-full">
                Assinar anual no WhatsApp
              </WaLink>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard hoverLift className="flex flex-col border border-[var(--glass-border)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Individual</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">
                Profissionais e estudantes: use os planos Mensal ou Anual acima (a partir de R$ 59,99/mês no anual).
              </p>
              <WaLink href={waPlanoAnual} className="mt-6 w-full">
                Escolher plano no WhatsApp
              </WaLink>
            </GlassCard>
            <GlassCard
              hoverLift
              className="relative flex flex-col border-2 border-brand-cyan/50 shadow-glow dark:border-brand-pink/40"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-0.5 text-xs font-semibold text-white dark:from-brand-purple dark:to-brand-pink">
                Mais escolhido
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Time</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">
                Squads e famílias que precisam alinhar objetivos, tarefas compartilhadas e visão única de progresso.
              </p>
              <WaLink href={waOnboarding} className="mt-6 w-full">
                Onboarding para equipes
              </WaLink>
            </GlassCard>
            <GlassCard hoverLift className="flex flex-col border border-[var(--glass-border)] bg-[#0d1117]/40 dark:bg-[#0d1117]/60">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Empresa</h3>
              <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">
                Implantação, governança, SLA e roadmap alinhado — o pacote para escala e conformidade.
              </p>
              <WaLink href={waOnboarding} variant="outline" className="mt-6 w-full border-white/20">
                Proposta corporativa
              </WaLink>
            </GlassCard>
          </div>
        </FadeInView>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-[var(--glass-border)] px-4 py-16 sm:px-6 md:px-8">
        <FadeInView className="mx-auto max-w-3xl">
          <h2 className="text-center font-mono text-xs font-semibold uppercase tracking-widest text-brand-blue dark:text-brand-cyan">
            FAQ
          </h2>
          <p className="mt-2 text-center text-2xl font-bold text-[var(--text-primary)]">Perguntas frequentes</p>
          <div className="mt-8 space-y-3">
            {[
              {
                q: "O InEvolving já está disponível?",
                a: "Sim. Novos usuários e empresas podem contratar e começar a usar; fale no WhatsApp para ativação, planos e onboarding.",
              },
              {
                q: "Posso integrar com outros sistemas?",
                a: "Sim. Oferecemos integrações e API para conectar finanças, identidade e fluxos já usados na sua operação.",
              },
              {
                q: "Funciona bem no celular?",
                a: "O produto é mobile-first e PWA instalável, com layout responsivo e suporte a uso parcial offline.",
              },
              {
                q: "Como fecho plano e pagamento?",
                a: "Tudo passa pelo time comercial no WhatsApp: diagnóstico rápido, proposta e próximos passos sem burocracia desnecessária.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 backdrop-blur-glass transition-colors hover:border-brand-cyan/35"
              >
                <summary className="cursor-pointer list-none font-medium text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span className="text-brand-cyan transition-transform duration-200 group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[var(--text-muted)]">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-[var(--text-muted)]">
            Outras dúvidas?{" "}
            <a
              href={waGeral}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-blue underline decoration-brand-cyan/50 underline-offset-2 hover:text-brand-cyan dark:text-brand-cyan"
            >
              Chame no WhatsApp
            </a>
            .
          </p>
        </FadeInView>
      </section>

      <footer className="mt-auto border-t border-[var(--glass-border)] bg-[var(--glass-bg)]/60 px-4 py-10 backdrop-blur-glass sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-svg.svg" alt="" width={36} height={36} className="h-8 w-auto opacity-90" />
            <div>
              <p className="font-semibold">InEvolving</p>
              <p className="text-sm text-[var(--text-muted)]">Evolução pessoal e profissional</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PrimaryLink href="/cadastro" variant="outline" className="text-xs sm:text-sm">
              Criar conta
            </PrimaryLink>
            <WaLink href={waDemo} className="text-xs sm:text-sm">
              Falar no WhatsApp
            </WaLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
