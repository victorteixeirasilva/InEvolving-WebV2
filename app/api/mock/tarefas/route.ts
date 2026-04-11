import { NextResponse } from "next/server";
import { mockTarefas } from "@/lib/mock-data";
import { normalizeSubtasksFromPayload } from "@/lib/subtarefas";
import type { Tarefa, TarefaStatus } from "@/lib/types/models";

/**
 * Mock de GET /auth/api/tasks/{data}
 * Fase 2: `apiClient.get(\`/auth/api/tasks/\${date}\`)`
 */
export async function GET() {
  return NextResponse.json(mockTarefas);
}

type Body = {
  nameTask?: string;
  descriptionTask?: string;
  idObjective?: number;
  dateTask?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  recurringUntil?: string;
  subtasks?: unknown;
};

/**
 * Mock de POST /auth/api/tasks
 * Fase 2: `apiClient.post("/auth/api/tasks", body)`
 */
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  if (!body.nameTask?.trim()) {
    return NextResponse.json({ ok: false, message: "Nome da tarefa é obrigatório" }, { status: 400 });
  }
  if (!body.idObjective) {
    return NextResponse.json({ ok: false, message: "Selecione um objetivo" }, { status: 400 });
  }
  if (!body.dateTask) {
    return NextResponse.json({ ok: false, message: "Data é obrigatória" }, { status: 400 });
  }

  const newId = Math.floor(Math.random() * 90_000) + 10_000;
  const uuid = `${newId}-mock-${Date.now().toString(36)}`;
  const subtasks = normalizeSubtasksFromPayload(body.subtasks, body.idObjective, body.dateTask);

  const task: Tarefa & { ok: true } = {
    ok: true,
    id: newId,
    uuid,
    nameTask: body.nameTask.trim(),
    descriptionTask: (body.descriptionTask ?? "").trim(),
    status: "PENDING" as TarefaStatus,
    dateTask: body.dateTask,
    idObjective: body.idObjective,
    isRecurring: body.isRecurring ?? false,
    recurringDays: body.recurringDays ?? [],
    recurringUntil: body.recurringUntil,
    ...(subtasks.length > 0 ? { subtasks } : {}),
  };

  return NextResponse.json(task);
}
