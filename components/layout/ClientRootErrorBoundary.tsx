"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean };

/**
 * Captura erros de renderização abaixo de Providers (ex.: store persist, RSC boundary).
 * Usa estilos inline para continuar utilizável se o CSS não carregar.
 */
export class ClientRootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[ClientRootErrorBoundary]", error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
            background: "#0f1419",
            color: "#e8eaed",
            maxWidth: "32rem",
            margin: "0 auto",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
            Não foi possível carregar a interface
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1.25rem" }}>
            Tente recarregar a página. Se usar o app instalado (PWA), feche e abra de novo ou limpe o
            cache do site nas configurações do navegador.
          </p>
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
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
