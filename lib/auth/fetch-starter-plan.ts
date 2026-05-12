import { API_BASE_URL } from "@/lib/constants";

const STARTER_PLAN_PATH = "/auth/api/user/starter-plan";

type StarterPlanApiBody = {
  isStarterPlan?: boolean;
};

export type FetchStarterPlanResult =
  | { kind: "ok"; isStarterPlan: boolean }
  | { kind: "unauthorized" }
  | { kind: "error" };

/**
 * GET `{API_BASE_URL}/auth/api/user/starter-plan` — header `Authorization: Bearer …`.
 * Retorna `{ isStarterPlan: boolean }`.
 * 401 → `unauthorized`; erros de rede / HTTP → `error`.
 */
export async function fetchStarterPlan(token: string): Promise<FetchStarterPlanResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${STARTER_PLAN_PATH}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    if (!res.ok) {
      return { kind: "error" };
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { kind: "error" };
    }

    const body = data as StarterPlanApiBody;
    const isStarterPlan = body.isStarterPlan === true;
    return { kind: "ok", isStarterPlan };
  } catch {
    return { kind: "error" };
  }
}
