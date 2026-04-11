import { NextResponse } from "next/server";
import type { LoginErrorCode } from "@/lib/auth/login-result";

type Body = { email?: string; password?: string };

/**
 * Simula respostas do POST /api/authentication/login para desenvolvimento.
 *
 * Cenários de teste (qualquer domínio no e-mail):
 * - Local do e-mail `naoconfirmado` → e-mail não verificado
 * - Local do e-mail `planoexpirado` → plano expirado
 * - Senha exatamente `CredencialErrada` → credenciais inválidas
 * - Demais combinações válidas (senha ≥ 6 no cliente) → sucesso
 */
export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false as const, code: "INVALID_CREDENTIALS" satisfies LoginErrorCode },
      { status: 400 }
    );
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const local = email.split("@")[0] ?? "";

  if (local === "naoconfirmado") {
    return NextResponse.json({ ok: false as const, code: "EMAIL_UNVERIFIED" satisfies LoginErrorCode });
  }
  if (local === "planoexpirado") {
    return NextResponse.json({ ok: false as const, code: "PLAN_EXPIRED" satisfies LoginErrorCode });
  }
  if (password === "CredencialErrada") {
    return NextResponse.json({ ok: false as const, code: "INVALID_CREDENTIALS" satisfies LoginErrorCode });
  }

  return NextResponse.json({
    ok: true as const,
    token: "mock-bearer-token",
  });
}
