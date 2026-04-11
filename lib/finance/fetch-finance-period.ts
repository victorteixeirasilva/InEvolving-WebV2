import { API_BASE_URL } from "@/lib/constants";
import { formatDateEnCA } from "@/lib/tasks/format-task-date-local";
import type { ResponseFinancas, Transacao } from "@/lib/types/models";

const FINANCE_PATH = "/auth/api/finance";

/** `YYYY-MM-DD` do 1º dia do mês (calendário local). */
export function firstDayOfMonthYmd(year: number, month1to12: number): string {
  const mm = String(month1to12).padStart(2, "0");
  return `${year}-${mm}-01`;
}

/** `YYYY-MM-DD` do 1º dia do mês seguinte (calendário local). */
export function firstDayOfNextMonthYmd(year: number, month1to12: number): string {
  const d = new Date(year, month1to12 - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return formatDateEnCA(d);
}

export type FetchFinancePeriodResult =
  | { kind: "ok"; data: ResponseFinancas }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "invalid_body" }
  | { kind: "http_error"; status: number };

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(String(v).replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseTransacao(raw: unknown): Transacao | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  const date = typeof o.date === "string" ? o.date : "";
  const description = typeof o.description === "string" ? o.description : "";
  const value = asNumber(o.value);
  const type = typeof o.type === "string" ? o.type : "";
  const idUser = o.idUser != null ? String(o.idUser) : undefined;
  return { id, idUser, date, description, value, type };
}

function parseTransacaoArray(raw: unknown): Transacao[] {
  if (!Array.isArray(raw)) return [];
  const out: Transacao[] = [];
  for (const item of raw) {
    const t = parseTransacao(item);
    if (t) out.push(t);
  }
  return out;
}

/**
 * Normaliza o JSON de GET `/auth/api/finance/{inicio}/{fim}`.
 */
export function normalizeFinanceApiBody(body: unknown): ResponseFinancas | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const idUserRaw = o.idUser;
  const idUser: string | number =
    typeof idUserRaw === "number" && Number.isFinite(idUserRaw)
      ? idUserRaw
      : idUserRaw != null
        ? String(idUserRaw)
        : 0;

  return {
    idUser,
    wage: asNumber(o.wage),
    totalBalance: asNumber(o.totalBalance),
    availableCostOfLivingBalance: asNumber(o.availableCostOfLivingBalance),
    balanceAvailableToInvest: asNumber(o.balanceAvailableToInvest),
    extraBalanceAdded: asNumber(o.extraBalanceAdded),
    transactionsCostOfLiving: parseTransacaoArray(o.transactionsCostOfLiving),
    transactionsInvestment: parseTransacaoArray(o.transactionsInvestment),
    transactionsExtraAdded: parseTransacaoArray(o.transactionsExtraAdded),
  };
}

/**
 * GET `{API_BASE_URL}/auth/api/finance/{primeiroDiaMes}/{primeiroDiaMesSeguinte}`.
 * Header `Authorization: Bearer …`.
 */
export async function fetchFinancePeriod(
  jwtToken: string,
  firstDayCurrentMonthYmd: string,
  firstDayNextMonthYmd: string
): Promise<FetchFinancePeriodResult> {
  const base = API_BASE_URL.replace(/\/$/, "");
  const a = encodeURIComponent(firstDayCurrentMonthYmd);
  const b = encodeURIComponent(firstDayNextMonthYmd);
  const url = `${base}${FINANCE_PATH}/${a}/${b}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    let data: unknown = null;
    try {
      const text = await res.text();
      if (text.trim()) data = JSON.parse(text);
    } catch {
      // TODO (contract): corpo não-JSON ou vazio em sucesso/erro.
      data = null;
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — sem permissão ou plano.
    // TODO (contract): 404 — intervalo ou recurso inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      const parsed = normalizeFinanceApiBody(data);
      if (!parsed) {
        // TODO (contract): 200 com formato parcial — campos obrigatórios e tipos.
        return { kind: "invalid_body" };
      }
      return { kind: "ok", data: parsed };
    }

    // TODO (contract): 400 / 422 — datas inválidas ou fora do contrato.
    // TODO (contract): 409 — conflito de versão.
    // TODO (contract): 429 — rate limit; Retry-After.
    if (res.status >= 500) {
      // TODO (contract): 502 / 503 — retry e mensagem ao usuário.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx documentados pelo back.
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
