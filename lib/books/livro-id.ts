/** Chave estável para DnD e ordem local (API usa UUID string). */
export function livroIdKey(id: string | number): string {
  return String(id);
}
