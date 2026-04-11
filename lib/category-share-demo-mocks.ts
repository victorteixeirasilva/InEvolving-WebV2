import type { Amigo, AjustesProfile } from "@/lib/ajustes-storage";
import { loadAjustesProfile, loadAmigos, saveAjustesProfile, saveAmigos } from "@/lib/ajustes-storage";
import {
  buildFullAcceptUrl,
  upsertAcceptedSharedCategory,
  upsertCategoryShareInvite,
  type AcceptedSharedCategory,
  type CategoryShareInvite,
} from "@/lib/category-share-storage";
import { mockDashboard } from "@/lib/mock-data";
import type { Category } from "@/lib/types/models";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Token fixo para testar a página de convite sem gerar novo link. */
export const DEMO_SHARE_PENDING_TOKEN = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

/** Token fixo da categoria já “aceita” injetada no dashboard. */
export const DEMO_SHARE_ACCEPTED_TOKEN = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

export const DEMO_OWNER_EMAIL = "marina.proprietaria@demo.inevolving.app";
export const DEMO_OWNER_NAME = "Marina (demo — dona da categoria)";
export const DEMO_INVITEE_EMAIL = "ricardo.convidado@demo.inevolving.app";

const DEMO_AMIGOS_EMAILS = [
  DEMO_INVITEE_EMAIL,
  "ana.colega@demo.inevolving.app",
  "joao.time@demo.inevolving.app",
] as const;

function cloneCategory(cat: Category): Category {
  const o = JSON.parse(JSON.stringify(cat)) as Category;
  delete o.sharedFrom;
  return o;
}

function notifySharedCategoriesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("inevolving:shared-categories-changed"));
}

export type ApplyCategoryShareDemoResult = {
  pendingInviteUrl: string;
  ownerEmail: string;
  inviteeEmail: string;
};

/**
 * Preenche perfil (só se e-mail estiver vazio), mescla amigos de demo, convite pendente e uma categoria já aceita.
 * Tudo em localStorage — útil para demonstrar compartilhamento sem backend.
 */
export function applyCategoryShareDemoMocks(): ApplyCategoryShareDemoResult {
  if (typeof window === "undefined") {
    return {
      pendingInviteUrl: "",
      ownerEmail: DEMO_OWNER_EMAIL,
      inviteeEmail: DEMO_INVITEE_EMAIL,
    };
  }

  const profile = loadAjustesProfile();
  if (!profile.email.trim()) {
    const next: AjustesProfile = {
      name: DEMO_OWNER_NAME,
      email: DEMO_OWNER_EMAIL,
      phone: profile.phone.trim(),
    };
    saveAjustesProfile(next);
  }

  const existing = loadAmigos();
  const seen = new Set(existing.map((a) => a.email.toLowerCase()));
  let maxId = existing.reduce((m, a) => Math.max(m, a.id), 0);
  const merged: Amigo[] = [...existing];
  for (const email of DEMO_AMIGOS_EMAILS) {
    const em = email.toLowerCase();
    if (seen.has(em)) continue;
    maxId += 1;
    merged.push({ id: maxId, email: em });
    seen.add(em);
  }
  saveAmigos(merged);

  const now = Date.now();
  const snapshotCarreira = cloneCategory(mockDashboard.categoryDTOList[0]);
  const snapshotBemEstar = cloneCategory(mockDashboard.categoryDTOList[1]);

  const pending: CategoryShareInvite = {
    token: DEMO_SHARE_PENDING_TOKEN,
    categoryId: snapshotCarreira.id,
    ownerEmail: DEMO_OWNER_EMAIL,
    ownerName: DEMO_OWNER_NAME,
    inviteeEmail: DEMO_INVITEE_EMAIL,
    status: "pending",
    expiresAt: new Date(now + WEEK_MS).toISOString(),
    categorySnapshot: snapshotCarreira,
    createdAt: new Date(now).toISOString(),
  };
  upsertCategoryShareInvite(pending);

  const sharedOwnerEmail = "paulo.colega@demo.inevolving.app";
  const sharedOwnerName = "Paulo (demo — já compartilhou)";
  const acceptedCategory: Category = {
    ...snapshotBemEstar,
    id: `share-inv-${DEMO_SHARE_ACCEPTED_TOKEN}`,
    shareToken: DEMO_SHARE_ACCEPTED_TOKEN,
    sharedSourceCategoryId: snapshotBemEstar.id,
    sharedFrom: {
      ownerEmail: sharedOwnerEmail,
      ownerName: sharedOwnerName,
    },
  };

  const accepted: AcceptedSharedCategory = {
    token: DEMO_SHARE_ACCEPTED_TOKEN,
    ownerEmail: sharedOwnerEmail,
    ownerName: sharedOwnerName,
    category: acceptedCategory,
    acceptedAt: new Date(now).toISOString(),
    sourceCategoryId: snapshotBemEstar.id,
  };
  upsertAcceptedSharedCategory(accepted);

  /** Sem este convite aceito, o botão «Adicionar tarefa» não aparece para o convidado (getInviteByToken). */
  const acceptedInvitePaul: CategoryShareInvite = {
    token: DEMO_SHARE_ACCEPTED_TOKEN,
    categoryId: snapshotBemEstar.id,
    ownerEmail: sharedOwnerEmail,
    ownerName: sharedOwnerName,
    inviteeEmail: DEMO_INVITEE_EMAIL,
    status: "accepted",
    expiresAt: new Date(now + WEEK_MS).toISOString(),
    categorySnapshot: cloneCategory(snapshotBemEstar),
    createdAt: new Date(now).toISOString(),
  };
  upsertCategoryShareInvite(acceptedInvitePaul);

  notifySharedCategoriesChanged();

  const path = `/dashboard/convite-categoria?token=${encodeURIComponent(DEMO_SHARE_PENDING_TOKEN)}`;
  return {
    pendingInviteUrl: buildFullAcceptUrl(path),
    ownerEmail: DEMO_OWNER_EMAIL,
    inviteeEmail: DEMO_INVITEE_EMAIL,
  };
}

/** Perfil como proprietária demo (enviar convites no modal). */
export function setDemoProfileAsOwner(): void {
  if (typeof window === "undefined") return;
  const p = loadAjustesProfile();
  saveAjustesProfile({
    name: DEMO_OWNER_NAME,
    email: DEMO_OWNER_EMAIL,
    phone: p.phone.trim(),
  });
}

/** Perfil como convidado demo (aceitar o convite do link pendente). */
export function setDemoProfileAsInvitee(): void {
  if (typeof window === "undefined") return;
  const p = loadAjustesProfile();
  saveAjustesProfile({
    name: "Ricardo (demo — convidado)",
    email: DEMO_INVITEE_EMAIL,
    phone: p.phone.trim(),
  });
}
