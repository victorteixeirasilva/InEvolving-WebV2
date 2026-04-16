import type { AjustesProfile } from "@/lib/ajustes-storage";
import type { UserProfileResponse } from "@/lib/user/fetch-user-profile";

/** Formata CPF com 11 dígitos para exibição (000.000.000-00). */
export function maskCpfDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length !== 11) return digits.trim();
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Converte resposta do GET perfil para o modelo local do modal de Ajustes.
 * `local` opcional: preserva `profilePhotoDataUrl` (data URL) se a API não enviou foto.
 */
export function userProfileApiToAjustesProfile(
  api: UserProfileResponse,
  local?: AjustesProfile
): AjustesProfile {
  const picUrl = (api.profilePictureUrl ?? "").trim();
  const cpfMasked = api.cpf ? maskCpfDigits(api.cpf) : "";

  const keepLocalPhoto =
    !picUrl &&
    local?.profilePhotoDataUrl &&
    local.profilePhotoDataUrl.startsWith("data:");

  return {
    name: api.fullName.trim(),
    email: api.email.trim(),
    phone: (api.phoneNumber ?? "").trim(),
    cpf: cpfMasked,
    profilePictureUrl: picUrl,
    profilePhotoDataUrl: keepLocalPhoto ? local!.profilePhotoDataUrl : "",
    birthDate: (api.dateOfBirth ?? "").trim(),
    billingAddress: (api.billingAddress ?? "").trim(),
    emailVerified: api.emailVerified,
    lastLogin: api.lastLogin.trim(),
    isActive: api.isActive,
  };
}
