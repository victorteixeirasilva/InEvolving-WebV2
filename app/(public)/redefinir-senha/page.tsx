import type { Metadata } from "next";
import { Suspense } from "react";
import RedefinirSenhaClient from "./RedefinirSenhaClient";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha usando o link enviado por e-mail.",
  robots: { index: false, follow: false },
};

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center px-4">
          <p className="text-[var(--text-muted)]">Carregando…</p>
        </div>
      }
    >
      <RedefinirSenhaClient />
    </Suspense>
  );
}
