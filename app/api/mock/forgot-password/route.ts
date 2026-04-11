import { NextResponse } from "next/server";

/**
 * Mock de POST /api/authentication/forgot — body: { userEmail }.
 * Não envia e-mail real; sempre responde sucesso para não expor se o e-mail existe.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userEmail?: string };
    const email = String(body.userEmail ?? "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, message: "E-mail inválido" }, { status: 400 });
    }
    return NextResponse.json({ ok: true as const });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
