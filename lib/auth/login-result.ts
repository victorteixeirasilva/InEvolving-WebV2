/** Códigos de erro de login alinhados à API / UX. */
export type LoginErrorCode =
  | "EMAIL_UNVERIFIED"
  | "INVALID_CREDENTIALS"
  | "PLAN_EXPIRED"
  | "SERVER_ERROR";

export type LoginResult =
  | { ok: true; token: string; urlVisionBord?: string }
  | { ok: false; code: LoginErrorCode };
