import { API_BASE_URL } from "@/lib/constants";

const RESPONSIBLE_PATH = "/auth/api/tasks/responsible";

export type TaskResponsibleResponse = {
  idTask: string;
  idResponsibleUser: string | null;
};

export type FetchTaskResponsibleResult =
  | { kind: "ok"; data: TaskResponsibleResponse }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number; message?: string };

export function parseTaskResponsibleResponse(body: unknown): TaskResponsibleResponse | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const idTask = typeof o.idTask === "string" ? o.idTask.trim() : "";
  if (!idTask) return null;
  let idResponsibleUser: string | null = null;
  if (o.idResponsibleUser === null || o.idResponsibleUser === undefined) {
    idResponsibleUser = null;
  } else if (typeof o.idResponsibleUser === "string" && o.idResponsibleUser.trim()) {
    idResponsibleUser = o.idResponsibleUser.trim();
  }
  return { idTask, idResponsibleUser };
}

/**
 * GET `{API_BASE_URL}/auth/api/tasks/responsible/{idTask}`
 */
export async function fetchTaskResponsible(
  jwtToken: string,
  idTask: string
): Promise<FetchTaskResponsibleResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${RESPONSIBLE_PATH}/${encodeURIComponent(idTask)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown = null;
    try {
      const text = await res.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (res.status === 401) return { kind: "unauthorized" };

    if (res.ok) {
      const parsed = parseTaskResponsibleResponse(data);
      if (!parsed) return { kind: "http_error", status: res.status };
      return { kind: "ok", data: parsed };
    }

    const message =
      data && typeof data === "object" && typeof (data as Record<string, unknown>).message === "string"
        ? String((data as Record<string, unknown>).message)
        : undefined;

    return { kind: "http_error", status: res.status, message };
  } catch {
    return { kind: "network_error" };
  }
}
