export type RegisterErrorCode =
  | "EMAIL_TAKEN"
  | "VALIDATION"
  | "SERVER"
  | "NETWORK"
  | "UNKNOWN";

export type RegisterResult =
  | { ok: true; message: string }
  | { ok: false; code: RegisterErrorCode; message: string };
