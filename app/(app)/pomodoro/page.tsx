import { PomodoroTimer } from "@/components/features/pomodoro/PomodoroTimer";
import { GlowingTitle } from "@/components/ui/GlowingTitle";

export const metadata = {
  title: "Pomodoro — Foco e Produtividade",
  description: "Gerencie seus ciclos de foco e descanso com o Timer Pomodoro do InEvolving.",
};

export default function PomodoroPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <GlowingTitle>Foco & Produtividade</GlowingTitle>
        <p className="text-[var(--text-muted)]">
          Utilize a técnica Pomodoro para gerenciar seu tempo e manter a concentração em suas tarefas.
        </p>
      </div>

      <PomodoroTimer />
      
      <div className="grid gap-6">
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">O que é a Técnica Pomodoro?</h3>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            É um método de gerenciamento de tempo que usa um cronômetro para dividir o trabalho em intervalos, geralmente de 25 minutos, separados por breves pausas.
          </p>
        </section>
        
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Dicas de Foco</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-[var(--text-muted)]">
            <li>Elimine distrações externas (celular, abas extras).</li>
            <li>Defina uma única tarefa para cada ciclo de foco.</li>
            <li>Aproveite o tempo de descanso para alongar ou beber água.</li>
            <li>Após 4 ciclos de foco, faça uma pausa mais longa (15-30 min).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
