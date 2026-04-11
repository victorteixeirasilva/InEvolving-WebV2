/** Troque `src` por PNG/WebP reais em `public/sobre/` quando tiver capturas (ex.: `/sobre/app-dashboard.webp`). */
export type ProductShot = {
  id: string;
  src: string;
  title: string;
  caption: string;
  accent: string;
};

export const PRODUCT_SHOTS: ProductShot[] = [
  {
    id: "dashboard",
    src: "/sobre/app-dashboard.png",
    title: "Dashboard",
    caption:
      "Categorias, visão geral e atalhos — tudo em painéis glass alinhados à sua rotina.",
    accent: "from-brand-blue/30 to-brand-cyan/20",
  },
  {
    id: "tarefas",
    src: "/sobre/app-tarefas.png",
    title: "Tarefas & Kanban",
    caption: "Lista e quadro visual no mesmo fluxo, com status e prazos claros.",
    accent: "from-brand-cyan/25 to-brand-purple/20",
  },
  {
    id: "financas",
    src: "/sobre/app-financas.png",
    title: "Finanças",
    caption: "Resumo, tendências e leitura rápida do mês em um só lugar.",
    accent: "from-brand-purple/25 to-brand-pink/15",
  },
  {
    id: "motivacao",
    src: "/sobre/app-motivacao.png",
    title: "Motivação",
    caption: "Sonhos e metas visuais para manter o propósito sempre visível.",
    accent: "from-brand-pink/20 to-brand-blue/20",
  },
];
