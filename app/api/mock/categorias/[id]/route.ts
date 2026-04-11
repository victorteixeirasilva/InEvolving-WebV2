import { NextResponse } from "next/server";

type Body = { categoryName?: string; categoryDescription?: string };

/**
 * Mock de PUT /auth/api/categories/{id}
 * Fase 2: trocar por `apiClient.put(\`/auth/api/categories/\${id}\`, body)`
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

  const name = String(body.categoryName ?? "").trim();
  const desc = String(body.categoryDescription ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Nome da categoria é obrigatório" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true as const,
    id: Number(params.id),
    categoryName: name,
    categoryDescription: desc,
  });
}
