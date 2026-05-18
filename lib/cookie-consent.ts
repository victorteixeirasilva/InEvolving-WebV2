/** `null` = usuário ainda não escolheu (exibir banner). */
export type AnalyticsConsent = "granted" | "denied" | null;

export function isAnalyticsConsentGranted(value: AnalyticsConsent): boolean {
  return value === "granted";
}
