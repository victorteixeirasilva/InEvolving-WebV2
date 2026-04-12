/** Injetado em build via `next.config.mjs` (`env`). */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
export const APP_BUILD_TIME_ISO = process.env.NEXT_PUBLIC_APP_BUILD_TIME ?? "";

export function formatBuildTimeForDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  });
}
