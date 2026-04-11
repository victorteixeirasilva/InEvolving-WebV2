"use client";

/**
 * Substitui o root layout em erro fatal. Precisa de `<html>` e `<body>` próprios.
 * Estilos inline: funciona mesmo se CSS/JS principal falhar (ex.: chunk PWA antigo).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          padding: "1.5rem",
          fontFamily: "system-ui, sans-serif",
          background: "#0f1419",
          color: "#e8eaed",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>Erro ao carregar o app</h1>
        {process.env.NODE_ENV === "development" && error?.message ? (
          <pre
            style={{
              fontSize: "0.75rem",
              opacity: 0.8,
              whiteSpace: "pre-wrap",
              marginBottom: "1rem",
            }}
          >
            {error.message}
          </pre>
        ) : (
          <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1.25rem" }}>
            Ocorreu um erro inesperado. Recarregue a página ou limpe os dados do site se o problema
            continuar (útil após atualizações do PWA).
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="button"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => reset()}
          >
            Tentar de novo
          </button>
          <button
            type="button"
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "#e8eaed",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
      </body>
    </html>
  );
}
