/** Alinhado ao comportamento descrito em docs (resposta sem sonhos / string sentinela). */
export function hasVisionBoardPreview(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  if (/no dreams were found/i.test(t)) return false;
  return true;
}
