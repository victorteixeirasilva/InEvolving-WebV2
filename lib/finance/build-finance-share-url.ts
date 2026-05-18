const FINANCE_SHARE_PATH = "/financas/compartilhado";

export function buildFinanceSharePath(jwt: string): string {
  const token = jwt.trim();
  return `${FINANCE_SHARE_PATH}?token=${encodeURIComponent(token)}`;
}

export function buildFinanceShareUrl(jwt: string): string {
  const path = buildFinanceSharePath(jwt);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}
