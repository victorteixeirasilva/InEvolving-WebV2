import { STORAGE_KEYS } from "@/lib/constants";
import type { Category } from "@/lib/types/models";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CategoryShareInvite = {
  token: string;
  categoryId: string;
  ownerEmail: string;
  ownerName: string;
  inviteeEmail: string;
  status: "pending" | "accepted" | "declined" | "revoked";
  expiresAt: string;
  categorySnapshot: Category;
  createdAt: string;
};

export type AcceptedSharedCategory = {
  token: string;
  ownerEmail: string;
  ownerName: string;
  category: Category;
  acceptedAt: string;
  /** UUID da categoria no painel do dono. */
  sourceCategoryId?: string;
};

function newToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function loadInvitesRaw(): CategoryShareInvite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.categoryShareInvites);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x) => x && typeof x === "object") as CategoryShareInvite[];
  } catch {
    return [];
  }
}

function saveInvites(list: CategoryShareInvite[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.categoryShareInvites, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function loadAcceptedRaw(): AcceptedSharedCategory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.categoryShareAccepted);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x) => x && typeof x === "object") as AcceptedSharedCategory[];
  } catch {
    return [];
  }
}

function saveAccepted(list: AcceptedSharedCategory[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.categoryShareAccepted, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function cloneCategoryForInvite(cat: Category): Category {
  const o = JSON.parse(JSON.stringify(cat)) as Category;
  delete o.sharedFrom;
  return o;
}

function withShareMeta(cat: Category, ownerEmail: string, ownerName: string): Category {
  return {
    ...cat,
    sharedFrom: { ownerEmail, ownerName: ownerName || undefined },
  };
}

export function createCategoryShareInvite(params: {
  category: Category;
  ownerEmail: string;
  ownerName: string;
  inviteeEmail: string;
}): { token: string; acceptPath: string } {
  const token = newToken();
  const now = Date.now();
  const invite: CategoryShareInvite = {
    token,
    categoryId: params.category.id,
    ownerEmail: params.ownerEmail.trim().toLowerCase(),
    ownerName: params.ownerName.trim(),
    inviteeEmail: params.inviteeEmail.trim().toLowerCase(),
    status: "pending",
    expiresAt: new Date(now + INVITE_TTL_MS).toISOString(),
    categorySnapshot: cloneCategoryForInvite(params.category),
    createdAt: new Date(now).toISOString(),
  };
  const list = loadInvitesRaw();
  list.push(invite);
  saveInvites(list);
  return { token, acceptPath: `/dashboard/convite-categoria?token=${encodeURIComponent(token)}` };
}

export function getInviteByToken(token: string): CategoryShareInvite | null {
  const t = token.trim();
  return loadInvitesRaw().find((i) => i.token === t) ?? null;
}

export function listPendingInvitesForEmail(viewerEmail: string): CategoryShareInvite[] {
  const em = viewerEmail.trim().toLowerCase();
  if (!em) return [];
  const now = Date.now();
  return loadInvitesRaw().filter((i) => {
    if (i.inviteeEmail !== em || i.status !== "pending") return false;
    return new Date(i.expiresAt).getTime() > now;
  });
}

export function acceptCategoryInvite(token: string, viewerEmail: string): { ok: true } | { ok: false; message: string } {
  const em = viewerEmail.trim().toLowerCase();
  if (!em) return { ok: false, message: "Configure seu e-mail no perfil (Ajustes) ou faça login." };

  const list = loadInvitesRaw();
  const idx = list.findIndex((i) => i.token === token.trim());
  if (idx < 0) return { ok: false, message: "Convite não encontrado." };

  const inv = list[idx];
  if (inv.status === "revoked") {
    return { ok: false, message: "O proprietário encerrou este compartilhamento." };
  }
  if (inv.status !== "pending") return { ok: false, message: "Este convite já foi utilizado ou recusado." };
  if (inv.inviteeEmail !== em) return { ok: false, message: "Este convite não é para o e-mail desta sessão." };
  if (new Date(inv.expiresAt).getTime() <= Date.now()) return { ok: false, message: "Este convite expirou." };

  list[idx] = { ...inv, status: "accepted" };
  saveInvites(list);

  const newId = `share-inv-${inv.token}`;
  const cat: Category = {
    ...inv.categorySnapshot,
    id: newId,
    shareToken: inv.token,
    sharedSourceCategoryId: inv.categoryId,
    sharedFrom: {
      ownerEmail: inv.ownerEmail,
      ownerName: inv.ownerName || undefined,
    },
  };

  const accepted = loadAcceptedRaw();
  if (!accepted.some((a) => a.token === inv.token)) {
    accepted.push({
      token: inv.token,
      ownerEmail: inv.ownerEmail,
      ownerName: inv.ownerName,
      category: cat,
      acceptedAt: new Date().toISOString(),
      sourceCategoryId: inv.categoryId,
    });
    saveAccepted(accepted);
  }

  return { ok: true };
}

export function declineCategoryInvite(token: string, viewerEmail: string): { ok: true } | { ok: false; message: string } {
  const em = viewerEmail.trim().toLowerCase();
  const list = loadInvitesRaw();
  const idx = list.findIndex((i) => i.token === token.trim());
  if (idx < 0) return { ok: false, message: "Convite não encontrado." };
  const inv = list[idx];
  if (inv.inviteeEmail !== em) return { ok: false, message: "Este convite não é para o e-mail desta sessão." };
  if (inv.status !== "pending") return { ok: false, message: "Convite já processado." };
  list[idx] = { ...inv, status: "declined" };
  saveInvites(list);
  return { ok: true };
}

function notifySharedCategoriesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("inevolving:shared-categories-changed"));
}

/** Convites ativos (pendente ou aceito) desta categoria para o e-mail do proprietário. */
/** Dono ou convidado com convite aceito para esta categoria (origem do dono). */
export function viewerHasCollaborativeAccessToCategory(
  viewerEmail: string,
  sourceCategoryId: string,
  ownerEmail: string
): boolean {
  const v = viewerEmail.trim().toLowerCase();
  const o = ownerEmail.trim().toLowerCase();
  if (!v) return false;
  if (v === o) return true;
  return loadInvitesRaw().some(
    (i) =>
      i.categoryId === sourceCategoryId &&
      i.ownerEmail === o &&
      i.inviteeEmail === v &&
      i.status === "accepted"
  );
}

export function listActiveSharesForCategory(categoryId: string, ownerEmail: string): CategoryShareInvite[] {
  const em = ownerEmail.trim().toLowerCase();
  return loadInvitesRaw()
    .filter(
      (i) =>
        i.categoryId === categoryId &&
        i.ownerEmail === em &&
        (i.status === "pending" || i.status === "accepted")
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Proprietário encerra o compartilhamento com um convidado (convite pendente ou já aceito).
 * Remove a cópia do dashboard do convidado neste navegador (mock local).
 */
export function revokeCategoryShareAsOwner(
  token: string,
  ownerEmail: string
): { ok: true } | { ok: false; message: string } {
  const em = ownerEmail.trim().toLowerCase();
  const list = loadInvitesRaw();
  const idx = list.findIndex((i) => i.token === token.trim());
  if (idx < 0) return { ok: false, message: "Convite não encontrado." };
  const inv = list[idx];
  if (inv.ownerEmail !== em) {
    return { ok: false, message: "Apenas o proprietário pode remover o acesso." };
  }
  if (inv.status === "declined" || inv.status === "revoked") {
    return { ok: false, message: "Este convite já não está ativo." };
  }
  list[idx] = { ...inv, status: "revoked" };
  saveInvites(list);
  const accepted = loadAcceptedRaw().filter((a) => a.token !== inv.token);
  saveAccepted(accepted);
  notifySharedCategoriesChanged();
  return { ok: true };
}

/**
 * Convidado remove a categoria compartilhada do próprio dashboard (encerra o vínculo).
 */
export function leaveSharedCategoryAsInvitee(
  token: string,
  viewerEmail: string
): { ok: true } | { ok: false; message: string } {
  const em = viewerEmail.trim().toLowerCase();
  if (!em) return { ok: false, message: "Configure seu e-mail em Ajustes." };
  const inv = getInviteByToken(token);
  if (!inv) return { ok: false, message: "Compartilhamento não encontrado." };
  if (inv.inviteeEmail !== em) {
    return { ok: false, message: "Esta categoria não está compartilhada com o seu e-mail." };
  }
  if (inv.status !== "accepted") {
    return { ok: false, message: "Só é possível sair de um compartilhamento já aceito." };
  }
  const list = loadInvitesRaw();
  const idx = list.findIndex((i) => i.token === token.trim());
  if (idx >= 0) list[idx] = { ...list[idx], status: "revoked" };
  saveInvites(list);
  const accepted = loadAcceptedRaw().filter((a) => a.token !== token.trim());
  saveAccepted(accepted);
  notifySharedCategoriesChanged();
  return { ok: true };
}

/** Categorias compartilhadas aceitas (para mesclar no dashboard). Ignora convites revogados. */
export function loadAcceptedSharedCategories(): AcceptedSharedCategory[] {
  const invites = loadInvitesRaw();
  const revoked = new Set(invites.filter((i) => i.status === "revoked").map((i) => i.token));
  return loadAcceptedRaw()
    .filter((a) => !revoked.has(a.token))
    .map((a) => {
      const inv = loadInvitesRaw().find((i) => i.token === a.token);
      const sid = a.sourceCategoryId ?? inv?.categoryId;
      return {
        ...a,
        category: {
          ...a.category,
          shareToken: a.token,
          ...(sid != null ? { sharedSourceCategoryId: sid } : {}),
        },
      };
    });
}

export function buildFullAcceptUrl(acceptPath: string): string {
  if (typeof window === "undefined") return acceptPath;
  return `${window.location.origin}${acceptPath}`;
}

/** Para seeds de demonstração: insere ou substitui convite pelo mesmo token. */
export function upsertCategoryShareInvite(invite: CategoryShareInvite): void {
  const list = loadInvitesRaw();
  const idx = list.findIndex((i) => i.token === invite.token);
  if (idx >= 0) list[idx] = invite;
  else list.push(invite);
  saveInvites(list);
}

/** Para seeds de demonstração: insere ou substitui entrada aceita pelo mesmo token. */
export function upsertAcceptedSharedCategory(entry: AcceptedSharedCategory): void {
  const list = loadAcceptedRaw();
  const idx = list.findIndex((a) => a.token === entry.token);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  saveAccepted(list);
}
