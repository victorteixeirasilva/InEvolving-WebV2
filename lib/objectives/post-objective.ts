import { API_BASE_URL } from "@/lib/constants";
import type { Objective } from "@/lib/types/models";
import { normalizeUserObjectiveItem } from "@/lib/objectives/fetch-user-objectives";

const OBJECTIVES_PATH = "/auth/api/objectives";

export type PostObjectiveInput = {
  nameObjective: string;
  descriptionObjective: string;
};

export type PostObjectiveResult =
  | { kind: "ok"; objective: Objective }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number }
  | { kind: "invalid_response" };

function parseCreatedObjectiveBody(data: unknown): Objective | null {
  const direct = normalizeUserObjectiveItem(data);
  if (direct) return direct;
  if (data !== null && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["data", "objective", "result", "content"] as const) {
      const v = o[key];
      if (v !== null && typeof v === "object") {
        const obj = normalizeUserObjectiveItem(v);
        if (obj) return obj;
      }
    }
  }
  // TODO (contract): 200 com só `id` + eco dos campos enviados — montar `Objective` mínimo aqui.
  return null;
}

/**
 * POST `{API_BASE_URL}/auth/api/objectives` — cria objetivo.
 * Header `Authorization: Bearer …`.
 */
export async function postObjective(
  jwtToken: string,
  input: PostObjectiveInput
): Promise<PostObjectiveResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${OBJECTIVES_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        nameObjective: input.nameObjective,
        descriptionObjective: input.descriptionObjective,
      }),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // TODO (contract): 200/201 com corpo vazio ou não-JSON — `Location` + GET para hidratar.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — plano sem criar objetivos ou cota esgotada.
    // TODO (contract): 404 — rota errada (ambiente).
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 201 Created vs 200 — ambos tratados por `res.ok`; `Location` do recurso criado.
      // TODO (contract): 204 No Content após criação — improvável; definir se refetch lista.
      const objective = parseCreatedObjectiveBody(data);
      if (objective === null) {
        // TODO (contract): log estruturado do corpo bruto para alinhar contrato.
        return { kind: "invalid_response" };
      }
      return { kind: "ok", objective };
    }

    // TODO (contract): 400 / 422 — validação; ler `message` / `errors` do corpo.
    // TODO (contract): 409 — conflito (duplicidade) se aplicável.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry idempotente com idempotency-key se o back suportar.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
