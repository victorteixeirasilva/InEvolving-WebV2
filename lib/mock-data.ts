import { formatDateEnCA } from "@/lib/tasks/format-task-date-local";
import type {
  Category,
  Livro,
  Objective,
  ResponseDashboard,
  ResponseFinancas,
  Sonho,
  Tarefa,
} from "@/lib/types/models";

/**
 * Pool global de todos os objetivos disponíveis no sistema.
 * Fase 2: buscar via GET /auth/api/objectives
 */
export const allObjectives: Objective[] = [
  {
    id: 1,
    nameObjective: "Certificação cloud",
    descriptionObjective: "AWS Solutions Architect",
    statusObjective: "IN_PROGRESS",
    totNumberTasks: 12,
    numberTasksToDo: 5,
    numberTasksDone: 4,
    numberTasksInProgress: 2,
    numberTasksOverdue: 1,
    numberTasksCancelled: 0,
  },
  {
    id: 2,
    nameObjective: "Saúde e rotina",
    descriptionObjective: "Treinos 4x/semana",
    statusObjective: "IN_PROGRESS",
    totNumberTasks: 8,
    numberTasksToDo: 3,
    numberTasksDone: 5,
    numberTasksInProgress: 0,
    numberTasksOverdue: 0,
    numberTasksCancelled: 0,
  },
  {
    id: 3,
    nameObjective: "Meditação diária",
    descriptionObjective: "10 min por dia",
    statusObjective: "DONE",
    totNumberTasks: 30,
    numberTasksDone: 30,
    numberTasksToDo: 0,
  },
  {
    id: 4,
    nameObjective: "Leitura semanal",
    descriptionObjective: "2 livros por mês",
    statusObjective: "IN_PROGRESS",
    totNumberTasks: 8,
    numberTasksToDo: 8,
    numberTasksDone: 0,
  },
  {
    id: 5,
    nameObjective: "Planejamento financeiro",
    descriptionObjective: "Orçamento e investimentos mensais",
    statusObjective: "DONE",
    totNumberTasks: 6,
    numberTasksToDo: 0,
    numberTasksDone: 6,
    numberTasksInProgress: 0,
  },
];

const objectivesSample = allObjectives.slice(0, 2);

export const mockDashboard: ResponseDashboard = {
  idUser: 1,
  /** Defina uma URL de imagem para simular preview; `null` = sem vision board */
  urlVisionBord: null,
  categoryDTOList: [
    {
      id: "mock-cat-carreira",
      categoryName: "Carreira",
      categoryDescription: "Metas profissionais e estudo contínuo",
      objectives: objectivesSample,
    },
    {
      id: "mock-cat-bemestar",
      categoryName: "Bem-estar",
      categoryDescription: "Corpo, mente e hábitos",
      objectives: [allObjectives[2]],
    },
  ],
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateEnCA(d);
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDateEnCA(d);
}

export const mockTarefas: Tarefa[] = [
  /* ── Hoje – PENDENTES ── */
  {
    id: 101,
    uuid: "e3a1b2c3-0001-4d5e-8f6a-aabbccdd0001",
    nameTask: "Revisar flashcards AWS",
    descriptionTask: "Bloco manhã – módulo IAM",
    status: "PENDING",
    dateTask: daysAgo(0),
    idObjective: 1,
    isRecurring: true,
    recurringDays: [1, 3, 5],
    recurringUntil: daysFromNow(30),
    subtasks: [
      {
        id: "st-demo-1",
        nameTask: "Cartões IAM users e policies",
        descriptionTask: "Focar em policies anexadas a roles",
        dateTask: daysAgo(0),
        status: "DONE",
        idObjective: 1,
      },
      {
        id: "st-demo-2",
        nameTask: "Quiz rápido do capítulo",
        descriptionTask: "",
        dateTask: daysAgo(0),
        status: "IN_PROGRESS",
        idObjective: 1,
      },
      {
        id: "st-demo-3",
        nameTask: "Anotar dúvidas para revisão",
        descriptionTask: "",
        dateTask: daysAgo(0),
        status: "PENDING",
        idObjective: 1,
      },
    ],
  },
  {
    id: 102,
    uuid: "e3a1b2c3-0002-4d5e-8f6a-aabbccdd0002",
    nameTask: "Ler capítulo 4 – Atomic Habits",
    descriptionTask: "Hábito de leitura diária",
    status: "PENDING",
    dateTask: daysAgo(0),
    idObjective: 4,
    isRecurring: true,
    recurringDays: [1, 2, 3, 4, 5],
    recurringUntil: daysFromNow(60),
  },
  /* ── Hoje – EM ANDAMENTO ── */
  {
    id: 103,
    uuid: "e3a1b2c3-0003-4d5e-8f6a-aabbccdd0003",
    nameTask: "Sprint planning semanal",
    descriptionTask: "Definir entregas e blockers do time",
    status: "IN_PROGRESS",
    dateTask: daysAgo(0),
    idObjective: 1,
  },
  {
    id: 104,
    uuid: "e3a1b2c3-0004-4d5e-8f6a-aabbccdd0004",
    nameTask: "Meditação guiada",
    descriptionTask: "10 minutos – app Insight Timer",
    status: "IN_PROGRESS",
    dateTask: daysAgo(0),
    idObjective: 3,
    isRecurring: true,
    recurringDays: [0, 1, 2, 3, 4, 5, 6],
    recurringUntil: daysFromNow(90),
  },
  /* ── Hoje – CONCLUÍDAS ── */
  {
    id: 105,
    uuid: "e3a1b2c3-0005-4d5e-8f6a-aabbccdd0005",
    nameTask: "Atualizar planilha financeira",
    descriptionTask: "Lançar gastos de ontem",
    status: "DONE",
    dateTask: daysAgo(0),
    idObjective: 5,
  },
  /* ── Hoje – CANCELADAS ── */
  {
    id: 106,
    uuid: "e3a1b2c3-0006-4d5e-8f6a-aabbccdd0006",
    nameTask: "Call com mentor",
    descriptionTask: "Reagendada para próxima semana",
    status: "CANCELLED",
    dateTask: daysAgo(0),
    idObjective: 1,
    cancellationReason: "Agenda do mentor indisponível",
  },
  /* ── Atrasadas ── */
  {
    id: 107,
    uuid: "e3a1b2c3-0007-4d5e-8f6a-aabbccdd0007",
    nameTask: "Praticar inglês – shadowing",
    descriptionTask: "30 min com vídeo de conferência tech",
    status: "OVERDUE",
    dateTask: daysAgo(3),
    idObjective: 1,
    isRecurring: true,
    recurringDays: [1, 3, 5],
    recurringUntil: daysFromNow(45),
  },
  {
    id: 108,
    uuid: "e3a1b2c3-0008-4d5e-8f6a-aabbccdd0008",
    nameTask: "Simulado AWS – 65 questões",
    descriptionTask: "Prova cronometrada",
    status: "OVERDUE",
    dateTask: daysAgo(5),
    idObjective: 1,
  },
  {
    id: 109,
    uuid: "e3a1b2c3-0009-4d5e-8f6a-aabbccdd0009",
    nameTask: "Treino de força",
    descriptionTask: "Academia – foco em membros superiores",
    status: "OVERDUE",
    dateTask: daysAgo(2),
    idObjective: 2,
    isRecurring: true,
    recurringDays: [1, 3, 5, 6],
    recurringUntil: daysFromNow(60),
  },
  {
    id: 110,
    uuid: "e3a1b2c3-0010-4d5e-8f6a-aabbccdd0010",
    nameTask: "Revisão orçamento mensal",
    descriptionTask: "Conferir alocação de investimentos",
    status: "OVERDUE",
    dateTask: daysAgo(7),
    idObjective: 5,
  },
];

export const mockFinancas: ResponseFinancas = {
  idUser: 1,
  wage: 8500,
  totalBalance: 12400,
  availableCostOfLivingBalance: 3200,
  balanceAvailableToInvest: 7800,
  extraBalanceAdded: 0,
  transactionsCostOfLiving: [
    { id: 1, date: "2026-04-01", description: "Aluguel", value: 2200, type: "expense" },
    { id: 2, date: "2026-04-03", description: "Mercado", value: 480, type: "expense" },
  ],
  transactionsInvestment: [
    { id: 3, date: "2026-04-02", description: "Aporte ETF", value: 1500, type: "investment" },
  ],
  transactionsExtraAdded: [],
};

export const mockLivros: Livro[] = [
  {
    id: 1,
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    theme: "Engenharia",
    status: "LENDO",
    coverImage: "/logo/logo-svg.svg",
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    theme: "Hábitos",
    status: "PENDENTE_LEITURA",
    coverImage: "/mobile/logoInicio.svg",
  },
];

export const mockSonhos: Sonho[] = [
  {
    id: 1,
    name: "Viagem ao Japão",
    description: "Sakura season",
    urlImage: "/mobile/logoInicio.svg",
  },
  {
    id: 2,
    name: "Home office zen",
    description: "Setup minimalista",
    urlImage: "/logo/logo-svg.svg",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return mockDashboard.categoryDTOList.find((c) => c.id === id);
}
