/** ID de medição GA4 (formato G-XXXXXXXX). Definir em `NEXT_PUBLIC_GA_MEASUREMENT_ID`. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || undefined;

export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}
