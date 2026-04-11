import { NextResponse } from "next/server";

type Body = { categoryName?: string; categoryDescription?: string };

/**
 * Mock de POST /auth/api/categories
 * Fase 2: trocar por `apiClient.post("/auth/api/categories", body)`
 */
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const name = String(body.categoryName ?? "").trim();
  const desc = String(body.categoryDescription ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Nome da categoria é obrigatório" },
      { status: 400 }
    );
  }

  // Simula ID gerado pelo backend
  const newId = Math.floor(Math.random() * 90_000) + 10_000;

  return NextResponse.json({
    ok: true as const,
    id: newId,
    categoryName: name,
    categoryDescription: desc,
  });
}
