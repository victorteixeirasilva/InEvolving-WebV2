import { API_BASE_URL, API_AUTH_PREFIX } from "@/lib/constants";
import type { Note } from "@/lib/types/models";

const NOTES_PATH = `${API_AUTH_PREFIX}/objectives/notes`;

export type PostObjectiveNoteResult =
  | { kind: "ok"; note: Note }
  | { kind: "unauthorized" }
  | { kind: "http_error"; status: number }
  | { kind: "network_error" };

/**
 * POST `{API_BASE_URL}/auth/api/objectives/notes/{idObjective}`
 * Persiste uma nota com o conteúdo Markdown gerado pela IA. Espera 201 Created.
 */
export async function postObjectiveNote(
  jwtToken: string,
  idObjective: string | number,
  content: string
): Promise<PostObjectiveNoteResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${NOTES_PATH}/${idObjective}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ content }),
    });

    if (res.status === 401) return { kind: "unauthorized" };

    if (!res.ok) return { kind: "http_error", status: res.status };

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { kind: "http_error", status: res.status };
    }

    return { kind: "ok", note: data as Note };
  } catch {
    return { kind: "network_error" };
  }
}
