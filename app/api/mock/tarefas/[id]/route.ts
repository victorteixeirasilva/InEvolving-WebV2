import { NextResponse } from "next/server";
import type { TarefaStatus } from "@/lib/types/models";

type Body = {
  nameTask?: string;
  descriptionTask?: string;
  idObjective?: number;
  dateTask?: string;
  status?: TarefaStatus;
  isRecurring?: boolean;
  recurringDays?: number[];
  recurringUntil?: string;
  cancellationReason?: string;
  subtasks?: unknown;
};

/**
 * Mock de PUT /auth/api/tasks/{id}
 * Aceita atualização parcial ou total da tarefa.
 * Fase 2: `apiClient.put(\`/auth/api/tasks/\${id}\`, body)`
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const validStatuses: TarefaStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE", "CANCELLED"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ ok: false, message: "Status inválido" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: Number(params.id), ...body });
}
