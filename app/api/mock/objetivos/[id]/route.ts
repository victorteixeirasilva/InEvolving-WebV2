import { NextResponse } from "next/server";

type Body = {
  nameObjective?: string;
  descriptionObjective?: string;
  statusObjective?: "IN_PROGRESS" | "DONE";
};

/**
 * Mock de PUT /auth/api/objectives/{id}
 * Fase 2: trocar por `apiClient.put(\`/auth/api/objectives/\${id}\`, body)`
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

  const name = String(body.nameObjective ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Nome do objetivo é obrigatório" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true as const,
    id: Number(params.id),
    nameObjective: name,
    descriptionObjective: String(body.descriptionObjective ?? "").trim(),
    statusObjective: body.statusObjective ?? "IN_PROGRESS",
  });
}
