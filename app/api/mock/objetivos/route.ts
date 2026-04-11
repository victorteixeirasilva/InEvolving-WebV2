import { NextResponse } from "next/server";
import { allObjectives } from "@/lib/mock-data";

/**
 * Mock de GET /auth/api/objectives/user
 * Fase 2: trocar por `apiClient.get("/auth/api/objectives/user")`
 */
export async function GET() {
  return NextResponse.json(allObjectives);
}

type Body = { nameObjective?: string; descriptionObjective?: string };

/**
 * Mock de POST /auth/api/objectives
 * Fase 2: trocar por `apiClient.post("/auth/api/objectives", body)`
 */
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const name = String(body.nameObjective ?? "").trim();
  const desc = String(body.descriptionObjective ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Nome do objetivo é obrigatório" },
      { status: 400 }
    );
  }

  const newId = Math.floor(Math.random() * 90_000) + 10_000;

  return NextResponse.json({
    ok: true as const,
    id: newId,
    nameObjective: name,
    descriptionObjective: desc,
    statusObjective: "IN_PROGRESS" as const,
    totNumberTasks: 0,
    numberTasksToDo: 0,
    numberTasksDone: 0,
    numberTasksInProgress: 0,
    numberTasksOverdue: 0,
    numberTasksCancelled: 0,
  });
}
