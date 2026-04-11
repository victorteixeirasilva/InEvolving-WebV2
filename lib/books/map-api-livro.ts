import type { Livro, LivroStatus } from "@/lib/types/models";

const VALID: LivroStatus[] = ["PENDENTE_LEITURA", "LENDO", "LEITURA_FINALIZADA"];

/** Força o status pela coluna de origem do GET (evita inconsistência do campo `status` no JSON). */
export function statusFromBooksEndpoint(
  endpoint: "todo" | "progress" | "completed"
): LivroStatus {
  switch (endpoint) {
    case "todo":
      return "PENDENTE_LEITURA";
    case "progress":
      return "LENDO";
    case "completed":
      return "LEITURA_FINALIZADA";
    default:
      return "PENDENTE_LEITURA";
  }
}

function statusFromApiField(raw: unknown): LivroStatus | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (u === "TO_DO" || u === "TODO" || u === "PENDENTE_LEITURA") return "PENDENTE_LEITURA";
  if (u === "IN_PROGRESS" || u === "PROGRESS" || u === "LENDO" || u === "READING") return "LENDO";
  if (u === "COMPLETED" || u === "DONE" || u === "LEITURA_FINALIZADA" || u === "FINALIZADA") {
    return "LEITURA_FINALIZADA";
  }
  if (VALID.includes(raw as LivroStatus)) return raw as LivroStatus;
  return null;
}

export function mapApiLivroRow(
  raw: unknown,
  fallbackStatus: LivroStatus
): Livro | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const idRaw = o.id;
  const id =
    typeof idRaw === "string" && idRaw.trim()
      ? idRaw.trim()
      : typeof idRaw === "number" && Number.isFinite(idRaw)
        ? idRaw
        : null;
  if (id == null) return null;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  const author = typeof o.author === "string" ? o.author.trim() : "";
  const theme = typeof o.theme === "string" ? o.theme.trim() : "";
  if (!title || !author) return null;

  const status = statusFromApiField(o.status) ?? fallbackStatus;
  const coverImage =
    typeof o.coverImage === "string" && o.coverImage.trim() ? o.coverImage.trim() : undefined;

  let idUser: string | number | undefined;
  if (typeof o.idUser === "string" && o.idUser.trim()) idUser = o.idUser.trim();
  else if (typeof o.idUser === "number" && Number.isFinite(o.idUser)) idUser = o.idUser;

  return {
    id,
    title,
    author,
    theme,
    status,
    coverImage,
    idUser,
  };
}
