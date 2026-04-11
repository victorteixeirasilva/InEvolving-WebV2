import { API_BASE_URL } from "@/lib/constants";

const VISION_BOARD_GENERATE_PATH = "/auth/api/motivation/dreams/visionbord/generate";

type VisionBoardApiBody = {
  urlVisionBord?: string | null;
};

export type FetchVisionBoardGenerateResult =
  | { kind: "ok"; urlVisionBord: string | null | undefined }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

/**
 * GET `{API_BASE_URL}/auth/api/motivation/dreams/visionbord/generate` — header `Authorization: Bearer …`.
 */
export async function fetchVisionBoardGenerate(jwtToken: string): Promise<FetchVisionBoardGenerateResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${VISION_BOARD_GENERATE_PATH}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // TODO (contract): resposta não-JSON em sucesso ou erro (text/html, vazio) — definir fallback e cópia ao usuário.
      data = {};
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão, plano expirado ou escopo insuficiente (mensagem/código no corpo?).
    // TODO (contract): 404 — endpoint ou recurso inexistente (typo `visionbord` vs `visionboard` no servidor).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      const body = data as VisionBoardApiBody;
      // TODO (contract): 200/204 com corpo vazio; 200 sem `urlVisionBord`; formato alternativo (ex.: `url`, array) — alinhar contrato.
      return { kind: "ok", urlVisionBord: body.urlVisionBord };
    }

    // TODO (contract): 400 / 422 — validação de query/headers se a API exigir parâmetros adicionais.
    // TODO (contract): 429 — Too Many Requests; cabeçalho Retry-After e política de retry no cliente.
    if (res.status >= 500) {
      // TODO (contract): 502 Bad Gateway / 503 Service Unavailable — mensagem distinta e eventual retry idempotente.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx não mapeados (409, 410, etc.) se documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): distinguir timeout (AbortSignal), rede indisponível e CORS; tempos máximos do cliente.
    return { kind: "network_error" };
  }
}
