/**
 * API e URLs externas — placeholders para integração (fase 2).
 * @see docs/REQUISITOS_UX_UI.md
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.inevolving.inovasoft.tech";

export const API_PUBLIC_PREFIX = "/api";
export const API_AUTH_PREFIX = "/auth/api";

export const WHATSAPP_HELP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_HELP_URL ??
  process.env.NEXT_PUBLIC_WHATSAPP_URL ??
  "https://wa.me/5511963695485?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20InEvolving";

const DEFAULT_RENEWAL_WA =
  "https://wa.me/5511963695485?text=Ol%C3%A1%21%20Meu%20plano%20do%20InEvolving%20expirou%20e%20gostaria%20de%20renovar.";

/** WhatsApp para renovação de plano (modal de login). */
export const WHATSAPP_RENEWAL_URL = (() => {
  const v = process.env.NEXT_PUBLIC_WHATSAPP_RENEWAL_URL?.trim();
  return v && v.length > 0 ? v : DEFAULT_RENEWAL_WA;
})();

/** Abre conversa no mesmo número configurado em `WHATSAPP_HELP_URL`, com texto personalizado. */
export function buildWhatsAppMessageUrl(message: string): string {
  try {
    const u = new URL(WHATSAPP_HELP_URL);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "wa.me" || host === "api.whatsapp.com") {
      const seg = u.pathname.replace(/^\//, "").split("/")[0];
      if (seg && /^\d+$/.test(seg)) {
        return `https://wa.me/${seg}?text=${encodeURIComponent(message)}`;
      }
    }
  } catch {
    /* ignore */
  }
  return `https://wa.me/5511963695485?text=${encodeURIComponent(message)}`;
}

export const STORAGE_KEYS = {
  token: "token",
  /** Valor de `urlVisionBord` na resposta do login (dashboard pode usar até refetch). */
  urlVisionBord: "inevolving_urlVisionBord",
  tema: "tema",
  tipoMenuDesk: "tipoMenuDesk",
  categoriaAtual: "categoriaAtual",
  objetivoAtual: "objetivoAtual",
  email: "email",
  /** Prefixo para histórico JARVAR: `jarvar_{objectiveId}` */
  jarvarPrefix: "jarvar_",
  /** Ordem dos cards no Kanban por coluna (ids numéricos por status). */
  tarefasKanbanOrder: "inevolving_tarefas_kanban_order",
  /** Salário exibido no módulo Finanças (mock local até API). */
  financasWage: "inevolving_financas_wage",
  /** Usuário fechou o onboarding 90-10 sem cadastrar salário (não reabrir automaticamente). */
  financasIntroDismissed: "inevolving_financas_intro_dismissed",
  /**
   * Estado local das transações do módulo Finanças: ordem e ids ocultos por mês (YYYY-MM).
   * JSON: Record<string, { order: string[]; hidden: string[] }>
   */
  financasTxState: "inevolving_financas_tx_state",
  /** Transações criadas localmente por mês (YYYY-MM) até a API existir. */
  financasTxLocalAdds: "inevolving_financas_tx_local_adds",
  /** Lista de livros (JSON) até API. */
  livrosData: "inevolving_livros_data",
  /** Ordem no Kanban de livros por coluna. */
  livrosKanbanOrder: "inevolving_livros_kanban_order",
  /** Lista de sonhos (motivação / vision board) até API. */
  sonhosData: "inevolving_sonhos_data",
  /** Perfil local em Ajustes (nome, e-mail, telefone) até API. */
  ajustesProfile: "inevolving_ajustes_profile",
  /** Lista de amigos (convites mock) em Ajustes. */
  ajustesFriends: "inevolving_ajustes_friends",
  /** Próxima data de renovação (YYYY-MM-DD) em Ajustes. */
  ajustesRenewal: "inevolving_ajustes_renewal",
  /** Convites de compartilhamento de categoria (mock local). */
  categoryShareInvites: "inevolving_category_share_invites",
  /** Categorias aceitas como convidado (cópias no dashboard). */
  categoryShareAccepted: "inevolving_category_share_accepted",
  /** Tarefas colaborativas em categorias compartilhadas (mock local). */
  sharedCategoryTasks: "inevolving_shared_category_tasks",
} as const;

/** 1 = escuro, 2 = claro (legado docs) */
export type TemaLegado = "1" | "2";
