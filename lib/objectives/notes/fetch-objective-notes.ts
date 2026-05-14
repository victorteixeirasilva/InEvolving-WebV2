import { API_BASE_URL, API_AUTH_PREFIX } from "@/lib/constants";
import type { Note } from "@/lib/types/models";

const NOTES_PATH = `${API_AUTH_PREFIX}/objectives/notes`;

export type FetchObjectiveNotesResult =
  | { kind: "ok"; notes: Note[] }
  | { kind: "not_found" }
  | { kind: "unauthorized" }
  | { kind: "http_error"; status: number }
  | { kind: "network_error" };

/**
 * GET `{API_BASE_URL}/auth/api/objectives/notes/{idObjective}`
 * Retorna a lista de notas de um objetivo. 404 é tratado como lista vazia.
 */
export async function fetchObjectiveNotes(
  jwtToken: string,
  idObjective: string | number
): Promise<FetchObjectiveNotesResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${NOTES_PATH}/${idObjective}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    if (res.status === 401) return { kind: "unauthorized" };
    if (res.status === 404) return { kind: "not_found" };

    if (!res.ok) return { kind: "http_error", status: res.status };

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { kind: "http_error", status: res.status };
    }

    if (!Array.isArray(data)) return { kind: "http_error", status: res.status };

    const notes = data as Note[];
    return { kind: "ok", notes };
  } catch {
    return { kind: "network_error" };
  }
}
