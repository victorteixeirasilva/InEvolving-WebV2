import { NextResponse } from "next/server";

/**
 * Mock de POST /auth/api/categories/objective
 * Body esperado: { idCategory: number; idObjective: number }
 * Fase 2: trocar por `apiClient.post("/auth/api/categories/objective", body)`
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: { idObjective?: number } = {};
  try {
    body = (await req.json()) as { idObjective?: number };
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  if (!body.idObjective) {
    return NextResponse.json({ ok: false, message: "idObjective é obrigatório" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    idCategory: Number(params.id),
    idObjective: body.idObjective,
  });
}
