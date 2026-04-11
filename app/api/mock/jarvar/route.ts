import { NextResponse } from "next/server";
import type { Objective } from "@/lib/types/models";

type Body = {
  objective: Objective;
  userContext?: string;
  previousAnalysis?: string;
};

const templates = [
  (o: Objective, prev?: string) =>
    `**Análise do objetivo: ${o.nameObjective}**\n\nCom base nos dados atuais — ${o.numberTasksDone ?? 0} tarefas concluídas de ${o.totNumberTasks ?? 0} — o objetivo demonstra ${
      (o.numberTasksDone ?? 0) / (o.totNumberTasks ?? 1) >= 0.7
        ? "excelente progresso"
        : "progresso moderado"
    }.\n\n**Pontos positivos:**\n• Ritmo de execução consistente nas tarefas priorizadas.\n• Redução no número de tarefas em atraso.${
      prev
        ? "\n\n**Comparação com análise anterior:**\nSinalizamos evolução positiva desde a última análise. O volume de tarefas concluídas cresceu, indicando maior foco e disciplina na execução."
        : ""
    }\n\n**Recomendações:**\n• Revise as tarefas canceladas para identificar padrões de bloqueio recorrentes.\n• Considere dividir tarefas longas em subtarefas menores para manter o momentum.\n• Agende uma revisão semanal do objetivo para ajuste de prioridades.`,

  (o: Objective, prev?: string) =>
    `**Diagnóstico — ${o.nameObjective}**\n\nStatus atual: **${o.statusObjective === "DONE" ? "Concluído" : "Em andamento"}**. Taxa de conclusão: ${Math.round(((o.numberTasksDone ?? 0) / (o.totNumberTasks ?? 1)) * 100)}%.\n\n**Análise crítica:**\nO objetivo apresenta ${o.numberTasksOverdue ?? 0} tarefas atrasadas, o que pode comprometer o prazo final caso não sejam endereçadas imediatamente.${
      prev
        ? "\n\n**Evolução desde a última análise:**\nHouve melhora perceptível no índice de conclusão. A estratégia anterior surtiu efeito positivo."
        : ""
    }\n\n**Plano de ação sugerido:**\n1. Priorize as ${o.numberTasksOverdue ?? 0} tarefas atrasadas esta semana.\n2. Identifique dependências que bloqueiam o progresso.\n3. Estabeleça um checkpoint diário de 15 minutos para acompanhamento.`,
];

/**
 * Mock de POST /auth/api/dashboard/ia
 * Fase 2: trocar por `apiClient.post("/auth/api/dashboard/ia", body)`
 */
export async function POST(req: Request) {
  let body: Body = { objective: {} as Objective };
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const oid = body.objective?.id;
  const idx =
    typeof oid === "number" && Number.isFinite(oid)
      ? Math.abs(oid) % templates.length
      : typeof oid === "string" && oid.length > 0
        ? Math.abs(
            oid.split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 0)
          ) % templates.length
        : 0;
  const response = templates[idx](body.objective, body.previousAnalysis);

  return NextResponse.json({ ok: true, response });
}
