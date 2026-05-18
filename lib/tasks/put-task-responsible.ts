import { API_BASE_URL } from "@/lib/constants";
import {
  parseTaskResponsibleResponse,
  type TaskResponsibleResponse,
} from "@/lib/tasks/fetch-task-responsible";

const RESPONSIBLE_PATH = "/auth/api/tasks/responsible";

export type PutTaskResponsiblePayload = {
  idTask: string;
  idResponsibleUser: string | null;
};

export type PutTaskResponsibleResult =
  | { kind: "ok"; data: TaskResponsibleResponse }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number; message?: string };

/**
 * PUT `{API_BASE_URL}/auth/api/tasks/responsible`
 */
export async function putTaskResponsible(
  jwtToken: string,
  payload: PutTaskResponsiblePayload
): Promise<PutTaskResponsibleResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = `${base}${RESPONSIBLE_PATH}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        idTask: payload.idTask,
        idResponsibleUser: payload.idResponsibleUser,
      }),
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
