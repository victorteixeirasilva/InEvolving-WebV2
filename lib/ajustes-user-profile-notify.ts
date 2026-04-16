import { appToast } from "@/lib/app-toast";
import type { AjustesProfile } from "@/lib/ajustes-storage";

/** Rota da página de Ajustes (perfil). Use no toast e em links. */
export const AJUSTES_PAGE_PATH = "/ajustes" as const;

/** Campos conferidos após integração com API (foto de perfil não entra). */
const FIELD_LABELS: Record<
  Exclude<
    keyof AjustesProfile,
    "profilePhotoDataUrl" | "profilePictureUrl" | "emailVerified" | "lastLogin" | "isActive"
  >,
  string
> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  cpf: "CPF",
  birthDate: "Data de nascimento",
  billingAddress: "Endereço de faturamento",
};

function isNullishOrBlank(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v !== "string") return true;
  return v.trim() === "";
}

/**
 * Lista rótulos dos campos obrigatórios (exceto foto) que estão vazios ou `null`/`undefined`
 * no objeto vindo da API ou do perfil local.
 */
export function getMissingUserProfileFieldLabels(
  profile: Partial<AjustesProfile> | Record<string, unknown>
): string[] {
  const p = profile as Record<string, unknown>;
  const missing: string[] = [];

  if (isNullishOrBlank(p.name)) missing.push(FIELD_LABELS.name);
  if (isNullishOrBlank(p.email)) missing.push(FIELD_LABELS.email);
  if (isNullishOrBlank(p.phone)) missing.push(FIELD_LABELS.phone);

  const cpfRaw = p.cpf;
  const cpfDigits =
    typeof cpfRaw === "string"
      ? cpfRaw.replace(/\D/g, "")
      : typeof cpfRaw === "number" && Number.isFinite(cpfRaw)
        ? String(cpfRaw).replace(/\D/g, "")
        : "";
  if (cpfDigits.length === 0) missing.push(FIELD_LABELS.cpf);

  if (isNullishOrBlank(p.birthDate)) missing.push(FIELD_LABELS.birthDate);
  if (isNullishOrBlank(p.billingAddress)) missing.push(FIELD_LABELS.billingAddress);

  return missing;
}

/**
 * Exibe toast quando o perfil (local ou retorno futuro da API) tiver campos obrigatórios vazios.
 * Inclui botão para abrir Ajustes. Chame após:
 * - login bem-sucedido;
 * - mount em Ajustes / `loadAjustesProfile`;
 * - resposta de `GET /auth/api/user/profile` já mapeada para `AjustesProfile`.
 */
export function notifyUserProfileIncompleteIfNeeded(
  profile: Partial<AjustesProfile> | Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const missing = getMissingUserProfileFieldLabels(profile);
  if (missing.length === 0) return;
  const list = missing.join(", ");
  appToast.show(
    `Perfil incompleto: preencha ${list} em Informações do usuário. A foto de perfil é opcional.`,
    {
      action: {
        label: "Ir para Ajustes",
        href: AJUSTES_PAGE_PATH,
      },
    }
  );
}

/** Chame após `GET /auth/api/user/profile` com o perfil já normalizado para o formato local. */
export function notifyAfterUserProfileFromApi(
  profile: Partial<AjustesProfile> | Record<string, unknown>
): void {
  notifyUserProfileIncompleteIfNeeded(profile);
}
