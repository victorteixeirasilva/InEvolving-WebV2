export type SonhoMotivacaoBand = "empty" | "starter" | "building" | "strong" | "abundant" | "visionary";

export function sonhoMotivacaoBand(count: number): SonhoMotivacaoBand {
  if (count === 0) return "empty";
  if (count <= 3) return "starter";
  if (count <= 10) return "building";
  if (count <= 25) return "strong";
  if (count <= 50) return "abundant";
  return "visionary";
}

/** Mensagem contextual conforme quantidade de sonhos (motivação / lembretes). */
export function sonhoMotivacaoInsight(count: number): {
  band: SonhoMotivacaoBand;
  title: string;
  body: string;
  panelClass: string;
} {
  const band = sonhoMotivacaoBand(count);
  switch (band) {
    case "empty":
      return {
        band,
        title: "Cadastre seus sonhos para começarmos a te motivar",
        body:
          "Ainda não há sonhos salvos. Ao registrar nome, descrição e (se quiser) uma imagem, o app pode lembrar você do que importa e montar seu Vision Board com mais sentido.",
        panelClass:
          "border-amber-500/35 bg-amber-500/[0.08] dark:border-amber-400/30 dark:bg-amber-400/[0.06]",
      };
    case "starter":
      return {
        band,
        title: "Ótimo primeiro passo — continue preenchendo seu quadro",
        body:
          count === 1
            ? "Você tem 1 sonho cadastrado. Adicione mais alguns: quanto mais clareza você der aos seus desejos, mais fácil é manter o foco nos dias difíceis."
            : `Você tem ${count} sonhos. Vale a pena ir além: pense em metas de curto e longo prazo para o InEvolving poder te acompanhar melhor.`,
        panelClass:
          "border-brand-cyan/35 bg-brand-cyan/[0.07] dark:border-brand-cyan/25 dark:bg-brand-cyan/[0.05]",
      };
    case "building":
      return {
        band,
        title: "Seu Vision Board está tomando forma",
        body:
          "Entre 4 e 10 sonhos você já constrói uma boa base. Revise descrições de vez em quando e acrescente imagens que te emocionem — isso reforça a motivação no dia a dia.",
        panelClass:
          "border-brand-blue/35 bg-brand-blue/[0.07] dark:border-brand-purple/30 dark:bg-brand-purple/[0.06]",
      };
    case "strong":
      return {
        band,
        title: "Portfólio de sonhos sólido",
        body:
          "Com esta quantidade você já cobre várias áreas da vida. Use a edição para afinar o que mudou e manter tudo alinhado com quem você quer ser.",
        panelClass:
          "border-emerald-500/30 bg-emerald-500/[0.07] dark:border-emerald-400/25 dark:bg-emerald-400/[0.05]",
      };
    case "abundant":
      return {
        band,
        title: "Muita inspiração cadastrada",
        body:
          "Parabéns pela riqueza de objetivos. Se a lista ficar longa, priorize os que mais mexem com você agora — foco também é motivação.",
        panelClass:
          "border-brand-pink/35 bg-brand-pink/[0.08] dark:border-brand-pink/25 dark:bg-brand-pink/[0.05]",
      };
    default:
      return {
        band: "visionary",
        title: "Visionário — repertório impressionante",
        body:
          "Você mantém um arquivo enorme de sonhos. Continue atualizando: celebrar conquistas e trocar imagens antigas por novas metas renova a energia.",
        panelClass:
          "border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-bg)_55%,transparent)]",
      };
  }
}
