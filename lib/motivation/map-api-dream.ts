import type { Sonho } from "@/lib/types/models";

export function mapApiDreamRow(raw: unknown): Sonho | null {
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

  const name = typeof o.name === "string" ? o.name.trim() : "";
  const description = typeof o.description === "string" ? o.description.trim() : "";
  if (!name) return null;
  // `description` pode vir vazio na API — o formulário exige texto; ainda assim exibimos o card.

  const urlImage =
    typeof o.urlImage === "string" && o.urlImage.trim() ? o.urlImage.trim() : undefined;

  let idUser: string | number | undefined;
  if (typeof o.idUser === "string" && o.idUser.trim()) idUser = o.idUser.trim();
  else if (typeof o.idUser === "number" && Number.isFinite(o.idUser)) idUser = o.idUser;

  return {
    id,
    name,
    description,
    urlImage,
    idUser,
  };
}
