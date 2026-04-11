import { NextResponse } from "next/server";

/**
 * Mock de DELETE /auth/api/categories/{categoryId}/objective/{objectiveId}
 * Fase 2: trocar por `apiClient.delete(\`/auth/api/categories/\${categoryId}/objective/\${objectiveId}\`)`
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; objectiveId: string } }
) {
  return NextResponse.json({
    ok: true,
    idCategory: Number(params.id),
    idObjective: Number(params.objectiveId),
  });
}
