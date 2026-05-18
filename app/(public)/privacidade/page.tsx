import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { FadeInView } from "@/components/layout/ScrollReveal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o InEvolving trata dados pessoais e cookies.",
};

export default function PrivacidadePage() {
  return (
    <div className="relative flex min-h-dvh flex-col px-4 pb-16 pt-10 sm:px-6 md:px-10">
      <FadeInView className="mx-auto w-full max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Última atualização: maio de 2026</p>
        </header>

        <GlassCard className="space-y-4 text-sm leading-relaxed text-[var(--text-muted)]">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Quem somos</h2>
            <p>
              O InEvolving é uma plataforma de gestão de evolução pessoal e profissional. Esta política descreve como
              tratamos dados quando você utiliza nosso site e aplicativo web.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Dados que coletamos</h2>
            <p>
              Para criar e manter sua conta, processamos dados de cadastro e uso do serviço (por exemplo, e-mail, nome e
              conteúdo que você registra na plataforma), conforme necessário para prestar o serviço contratado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Cookies</h2>
            <p>
              <strong className="text-[var(--text-primary)]">Essenciais:</strong> necessários para login, segurança e
              preferências (por exemplo, tema). Não exigem consentimento para funcionamento básico.
            </p>
            <p>
              <strong className="text-[var(--text-primary)]">Análise (opcional):</strong> com seu consentimento,
              utilizamos o Google Analytics 4 para métricas agregadas de navegação (páginas visitadas, dispositivo
              aproximado, origem do tráfego). Você pode aceitar ou recusar no banner de cookies e alterar depois em{" "}
              <Link href="/ajustes" className="text-brand-cyan underline-offset-2 hover:underline">
                Ajustes
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Base legal (LGPD)</h2>
            <p>
              O tratamento para prestação do serviço baseia-se na execução de contrato e legítimo interesse, quando
              aplicável. Cookies de análise dependem do seu consentimento, que pode ser revogado a qualquer momento.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Seus direitos</h2>
            <p>
              Você pode solicitar acesso, correção ou exclusão de dados, além de revogar consentimentos, entrando em
              contato pelo canal de ajuda do aplicativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Google Analytics</h2>
            <p>
              O Google pode processar dados conforme a{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan underline-offset-2 hover:underline"
              >
                política de privacidade do Google
              </a>
              . O script só é carregado após você aceitar cookies de análise.
            </p>
          </section>
        </GlassCard>

        <p className="text-center text-sm">
          <Link href="/" className="text-brand-cyan underline-offset-2 hover:underline">
            Voltar ao início
          </Link>
        </p>
      </FadeInView>
    </div>
  );
}
