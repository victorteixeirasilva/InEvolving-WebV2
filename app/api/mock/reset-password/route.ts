import { NextResponse } from "next/server";

type Body = { idToken?: string; newPassword?: string };

/**
 * Mock de PUT /api/authentication/forgot/update — body: { idToken, newPassword }.
 * `idToken` = valor do query param `token` do link por e-mail.
 *
 * Teste de erro: token exatamente `invalid-token-test`.
 */
export async function PUT(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "Payload inválido" }, { status: 400 });
  }

  const idToken = String(body.idToken ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  if (!idToken) {
    return NextResponse.json({ ok: false, message: "Token ausente" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ ok: false, message: "Senha muito curta" }, { status: 400 });
  }

  if (idToken === "invalid-token-test") {
    return NextResponse.json(
      { ok: false, message: "Este link expirou ou é inválido. Solicite um novo e-mail de recuperação." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true as const });
}
