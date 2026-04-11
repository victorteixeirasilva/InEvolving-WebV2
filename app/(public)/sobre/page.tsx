import type { Metadata } from "next";
import { SobrePageContent } from "@/components/features/sobre/SobrePageContent";

export const metadata: Metadata = {
  title: "InEvolving — Plataforma em produção",
  description:
    "Dashboard, tarefas, kanban, finanças, livros, motivação e colaboração em um só lugar. Veja as telas e fale com o time no WhatsApp.",
  openGraph: {
    title: "InEvolving — Evolução pessoal e profissional",
    description:
      "Plataforma completa, PWA instalável e experiência premium. Conheça o produto e contrate pelo WhatsApp.",
  },
};

export default function SobrePage() {
  return <SobrePageContent />;
}
