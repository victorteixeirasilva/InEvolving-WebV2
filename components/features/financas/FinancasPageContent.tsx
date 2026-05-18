"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  BanknotesIcon,
  LinkIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FinancasAvailableCostOfLivingCard } from "@/components/features/financas/FinancasAvailableCostOfLivingCard";
import { FinancasAvailableInvestCard } from "@/components/features/financas/FinancasAvailableInvestCard";
import { FinancasExtraIncomeCard } from "@/components/features/financas/FinancasExtraIncomeCard";
import { FinancasTotalBalanceCard } from "@/components/features/financas/FinancasTotalBalanceCard";
import { FinancasTransactionsPanel } from "@/components/features/financas/FinancasTransactionsPanel";
import { FinancasIntroModal } from "@/components/features/financas/FinancasIntroModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { STORAGE_KEYS, WHATSAPP_RENEWAL_URL } from "@/lib/constants";
import { clearFinanceShareSession } from "@/lib/finance/finance-share-session";
import { useStarterPlan } from "@/hooks/use-starter-plan";
import {
  fetchFinancePeriod,
  firstDayOfMonthYmd,
  firstDayOfNextMonthYmd,
} from "@/lib/finance/fetch-finance-period";
import { patchFinanceWage } from "@/lib/finance/patch-finance-wage";
import type { ResponseFinancas } from "@/lib/types/models";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function formatBrl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const EMPTY_FINANCE_DATA: ResponseFinancas = {
  idUser: "",
  wage: 0,
  totalBalance: 0,
  availableCostOfLivingBalance: 0,
  balanceAvailableToInvest: 0,
  extraBalanceAdded: 0,
  transactionsCostOfLiving: [],
  transactionsInvestment: [],
  transactionsExtraAdded: [],
};

export type FinancasPageContentProps = {
  sharedSession?: boolean;
  onShareClick?: () => void;
};

export function FinancasPageContent({ sharedSession = false, onShareClick }: FinancasPageContentProps) {
  const router = useRouter();
  const isStarterPlan = useStarterPlan();
  const authRedirect401Ref = useRef(false);

  const handleUnauthorized = useCallback(() => {
    if (!authRedirect401Ref.current) {
      authRedirect401Ref.current = true;
      clearFinanceShareSession();
      router.push("/login");
      window.alert(
        "Sessão expirada ou inválida. Faça login novamente ou peça um novo link de compartilhamento."
      );
    }
  }, [router]);

  const [financeData, setFinanceData] = useState<ResponseFinancas>(EMPTY_FINANCE_DATA);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [financeApiOk, setFinanceApiOk] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [wage, setWage] = useState(0);
  const [wageHydrated, setWageHydrated] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [isEditingWage, setIsEditingWage] = useState(false);
  const [wageDraft, setWageDraft] = useState("");
  const [wageSaving, setWageSaving] = useState(false);
  const [wageSaveError, setWageSaveError] = useState<string | null>(null);

  const f = financeData;
  const pageTitle = sharedSession ? "Planejamento compartilhado" : "Finanças";

  useEffect(() => {
    if (sharedSession) {
      setWageHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.financasWage);
      if (raw != null && raw !== "") {
        const n = Number(String(raw).replace(",", "."));
        if (Number.isFinite(n) && n >= 0) setWage(n);
      }
    } catch {
      /* ignore */
    }
    setWageHydrated(true);
  }, [sharedSession]);

  useEffect(() => {
    if (sharedSession) return;
    if (!wageHydrated) return;
    if (!financeApiOk) return;
    if (financeData.wage !== 0) return;
    try {
      if (localStorage.getItem(STORAGE_KEYS.financasIntroDismissed) === "1") return;
    } catch {
      return;
    }
    setIntroOpen(true);
  }, [sharedSession, wageHydrated, financeApiOk, financeData.wage]);

  useEffect(() => {
    if (financeApiOk && financeData.wage > 0) setIntroOpen(false);
  }, [financeApiOk, financeData.wage]);

  const refetchFinance = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      let jwt = "";
      try {
        jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwt) {
        setFinanceData(EMPTY_FINANCE_DATA);
        setFinanceLoading(false);
        setFinanceError(sharedSession ? "Link inválido ou expirado. Peça um novo link." : null);
        setFinanceApiOk(false);
        return;
      }

      const parts = selectedMonth.split("-");
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
        if (!silent) setFinanceLoading(false);
        return;
      }

      if (!silent) {
        setFinanceLoading(true);
        setFinanceError(null);
        setFinanceApiOk(false);
      }

      const start = firstDayOfMonthYmd(y, m);
      const end = firstDayOfNextMonthYmd(y, m);
      const result = await fetchFinancePeriod(jwt, start, end);

      if (!silent) setFinanceLoading(false);

      if (result.kind === "unauthorized") {
        handleUnauthorized();
        setFinanceData(EMPTY_FINANCE_DATA);
        setFinanceApiOk(false);
        return;
      }

      if (result.kind === "ok") {
        setFinanceData(result.data);
        setWage(result.data.wage);
        setFinanceApiOk(true);
        setFinanceError(null);
        return;
      }

      if (result.kind === "invalid_body") {
        setFinanceError("Resposta da API em formato inesperado.");
        setFinanceData(EMPTY_FINANCE_DATA);
        setFinanceApiOk(false);
        return;
      }

      if (result.kind === "network_error") {
        setFinanceError("Falha de conexão. Verifique sua internet.");
        setFinanceData(EMPTY_FINANCE_DATA);
        setFinanceApiOk(false);
        return;
      }

      setFinanceError("Não foi possível carregar os dados de finanças. Tente novamente.");
      setFinanceData(EMPTY_FINANCE_DATA);
      setFinanceApiOk(false);
    },
    [selectedMonth, handleUnauthorized, sharedSession]
  );

  useEffect(() => {
    void refetchFinance();
  }, [refetchFinance]);

  const handleIntroOpenChange = (open: boolean) => {
    setIntroOpen(open);
    if (!open) {
      try {
        localStorage.setItem(STORAGE_KEYS.financasIntroDismissed, "1");
      } catch {
        /* ignore */
      }
    }
  };

  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-");
  const selectedYearNum = Number(selectedYear);
  const selectedMonthNum = Number(selectedMonthNumber);
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const dt = new Date(Number(year), Number(month) - 1, 1);
    return dt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const yearOptions = useMemo(() => {
    const nowYear = new Date().getFullYear();
    const minYear = nowYear - 100;
    const maxYear = nowYear + 100;
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y -= 1) arr.push(y);
    return arr;
  }, []);

  const saveWage = useCallback(async () => {
    const parsed = Number(wageDraft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    let jwt = "";
    try {
      jwt = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
    } catch {
      /* ignore */
    }

    const persistLocal = () => {
      try {
        localStorage.setItem(STORAGE_KEYS.financasWage, String(parsed));
      } catch {
        /* ignore */
      }
    };

    const applySuccess = () => {
      persistLocal();
      setWage(parsed);
      setFinanceData((prev) => ({ ...prev, wage: parsed }));
      setWageSaveError(null);
      setIsEditingWage(false);
      setIntroOpen(false);
    };

    if (!jwt) {
      applySuccess();
      return;
    }

    setWageSaving(true);
    setWageSaveError(null);
    const result = await patchFinanceWage(jwt, parsed);
    setWageSaving(false);

    if (result.kind === "unauthorized") {
      handleUnauthorized();
      return;
    }
    if (result.kind === "ok" || result.kind === "ok_no_body") {
      try {
        localStorage.setItem(STORAGE_KEYS.financasWage, String(parsed));
      } catch {
        /* ignore */
      }
      await refetchFinance({ silent: true });
      setWageSaveError(null);
      setIsEditingWage(false);
      setIntroOpen(false);
      return;
    }
    if (result.kind === "network_error") {
      setWageSaveError("Falha de conexão. Verifique sua internet.");
      return;
    }
    setWageSaveError("Não foi possível salvar o salário. Tente novamente.");
  }, [wageDraft, handleUnauthorized, refetchFinance]);

  const setMonthByParts = (year: number, month: number) => {
    const mm = String(month).padStart(2, "0");
    setSelectedMonth(`${year}-${mm}`);
  };

  if (!sharedSession && isStarterPlan) {
    return (
      <div className="mx-auto max-w-2xl pt-4 md:pt-6">
        <h1 className="mb-6 text-2xl font-bold">{pageTitle}</h1>
        <GlassCard>
          <div className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:items-start sm:text-start">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/30 to-brand-cyan/20 text-brand-cyan shadow-glow"
              aria-hidden
            >
              <BanknotesIcon className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Funcionalidade não disponível no plano Starter
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                O módulo de <strong className="font-semibold text-[var(--text-primary)]">Finanças</strong> não está
                incluído no plano Starter. Faça um upgrade para controlar seu saldo, registrar transações e visualizar
                sua saúde financeira.
              </p>
              <a
                href={WHATSAPP_RENEWAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex tap-target items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-[380ms] hover:shadow-glass-lg dark:from-brand-purple dark:to-brand-pink"
              >
                Fazer upgrade via WhatsApp
              </a>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-6 sm:px-4 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          {sharedSession && (
            <p className="text-sm text-[var(--text-muted)]">
              Você está visualizando um planejamento compartilhado. Pode adicionar e remover transações.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {financeLoading && (
            <p className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]" aria-live="polite">
              <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin text-brand-cyan" aria-hidden />
              Carregando dados do mês…
            </p>
          )}
          {onShareClick && (
            <Button type="button" variant="outline" onClick={onShareClick} className="inline-flex items-center gap-2">
              <LinkIcon className="h-4 w-4" aria-hidden />
              Compartilhar com família
            </Button>
          )}
        </div>
      </div>

      <GlassCard>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(160px,200px)_auto] md:items-end">
          <div className="min-w-[220px]">
            <label htmlFor="fin-month" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
              Ver mês
            </label>
            <GlassSelect
              id="fin-month"
              value={String(selectedMonthNum)}
              onChange={(e) => setMonthByParts(selectedYearNum, Number(e.target.value))}
              className="capitalize"
            >
              {monthNames.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="min-w-[160px]">
            <label htmlFor="fin-year" className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
              Ano
            </label>
            <GlassSelect
              id="fin-year"
              value={String(selectedYearNum)}
              onChange={(e) => setMonthByParts(Number(e.target.value), selectedMonthNum)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Exibindo: <span className="font-semibold text-[var(--text-primary)]">{formatMonth(selectedMonth)}</span>
          </div>
        </div>
      </GlassCard>

      {financeError && (
        <p
          className="rounded-xl border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink"
          role="alert"
        >
          {financeError}
        </p>
      )}

      <div className={cn("space-y-6", financeLoading && "opacity-60")}>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GlassCard id="financas-salario-card" className="flex h-full min-h-0 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[var(--text-muted)]">Salário</p>
                {!sharedSession && !isEditingWage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setWageDraft(wage > 0 ? String(wage) : "");
                      setWageSaveError(null);
                      setIsEditingWage(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:border-brand-cyan/40 hover:text-[var(--text-primary)]"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Editar
                  </button>
                ) : !sharedSession && isEditingWage ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingWage(false)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--glass-border)] px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                ) : null}
              </div>
              {!isEditingWage || sharedSession ? (
                <p className="mt-auto pt-3 text-xl font-bold text-brand-cyan">{formatBrl(wage)}</p>
              ) : (
                <div className="mt-auto flex flex-1 flex-col justify-end space-y-2 pt-3">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={wageDraft}
                    onChange={(e) => setWageDraft(e.target.value)}
                    className="py-2"
                    aria-label="Novo salário"
                    disabled={wageSaving}
                  />
                  {wageSaveError && (
                    <p className="text-xs text-brand-pink" role="alert">
                      {wageSaveError}
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={() => void saveWage()}
                    disabled={wageSaving}
                    className="w-full py-2 text-xs"
                  >
                    {wageSaving ? "Salvando…" : "Salvar salário"}
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>
          <FinancasAvailableCostOfLivingCard availableCostOfLivingBalance={f.availableCostOfLivingBalance} />
          <FinancasAvailableInvestCard balanceAvailableToInvest={f.balanceAvailableToInvest} />
          <FinancasExtraIncomeCard extraBalanceAdded={f.extraBalanceAdded} />
        </div>

        <FinancasTotalBalanceCard totalBalance={f.totalBalance} />

        <FinancasTransactionsPanel
          selectedMonth={selectedMonth}
          data={f}
          onUnauthorized={handleUnauthorized}
          refetchFinance={() => refetchFinance({ silent: true })}
        />
      </div>

      {!sharedSession && (
        <FinancasIntroModal
          open={introOpen}
          onOpenChange={handleIntroOpenChange}
          onCadastrarSalario={() => {
            setWageDraft(wage > 0 ? String(wage) : "");
            setIsEditingWage(true);
            requestAnimationFrame(() => {
              document.getElementById("financas-salario-card")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            });
          }}
        />
      )}
    </div>
  );
}
