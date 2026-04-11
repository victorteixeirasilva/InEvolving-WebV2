"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon as HistoryIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { STORAGE_KEYS } from "@/lib/constants";
import { fetchCancellationReasons } from "@/lib/dashboard/fetch-cancellation-reasons";
import { buildDashboardIaRequestBody, postDashboardIa } from "@/lib/dashboard/post-dashboard-ia";
import { cn } from "@/lib/utils";
import type { JarvarAnalysis, Objective, ObjectiveAnalyticsData } from "@/lib/types/models";

/* ─── Paleta de cores alinhada ao tema ─── */
const COLORS = {
  done: "#34d399",
  inProgress: "#00BCD4",
  toDo: "#1976D2",
  overdue: "#FF006E",
  cancelled: "#94a3b8",
  added: "#7B2CBF",
};

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(10,25,41,0.85)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(12px)",
    color: "#fff",
    fontSize: 12,
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#94a3b8", fontWeight: 600 },
};

const ease = [0.16, 1, 0.3, 1] as const;

const emptyObjectiveAnalytics: ObjectiveAnalyticsData = {
  cancellationReasons: [],
  weeklyProgress: [],
  tasksByPriority: [],
};

/* ─── helpers localStorage ─── */
function jarvarKey(objectiveId: number | string) {
  return `${STORAGE_KEYS.jarvarPrefix}${objectiveId}`;
}
function loadHistory(objectiveId: number | string): JarvarAnalysis[] {
  try {
    return JSON.parse(localStorage.getItem(jarvarKey(objectiveId)) ?? "[]") as JarvarAnalysis[];
  } catch {
    return [];
  }
}
function saveHistory(objectiveId: number | string, history: JarvarAnalysis[]) {
  try {
    localStorage.setItem(jarvarKey(objectiveId), JSON.stringify(history));
  } catch { /* ignore */ }
}

/* ─── Stat card ─── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-4", bg)}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg, color)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

/* ─── Tooltip customizado ─── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {name:string;value:number;color:string}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_TOOLTIP_STYLE.contentStyle}>
      {label && <p style={CHART_TOOLTIP_STYLE.labelStyle} className="mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ─── Seção de histórico JARVAR ─── */
function JarvarHistoryPanel({
  history,
  onSelect,
  selected,
}: {
  history: JarvarAnalysis[];
  onSelect: (a: JarvarAnalysis | null) => void;
  selected: JarvarAnalysis | null;
}) {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-brand-blue/10 hover:text-brand-cyan"
      >
        <HistoryIcon className="h-4 w-4" aria-hidden />
        Histórico de análises ({history.length})
        <ChevronDownIcon
          className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
              {history.map((a) => {
                const isSelected = selected?.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect(isSelected ? null : a)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-300",
                      isSelected
                        ? "bg-brand-cyan/10 ring-1 ring-brand-cyan/40"
                        : "hover:bg-brand-blue/8"
                    )}
                  >
                    <ChevronRightIcon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 transition-transform duration-300",
                        isSelected ? "rotate-90 text-brand-cyan" : "text-[var(--text-muted)]"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {new Date(a.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {a.userContext && (
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                          {a.userContext}
                        </p>
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                        {a.response.replace(/\*\*/g, "").slice(0, 120)}…
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="mt-3 rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 p-4"
        >
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-cyan">
            Análise selecionada como contexto
          </p>
          <p className="whitespace-pre-line text-sm text-[var(--text-muted)]">
            {selected.response}
          </p>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="mt-2 text-xs text-[var(--text-muted)] underline-offset-2 hover:underline"
          >
            Remover contexto
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Formata texto markdown simples ─── */
function AnalysisText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-bold text-[var(--text-primary)]">
              {line.slice(2, -2)}
            </p>
          );
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j} className="font-semibold text-[var(--text-primary)]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ─── Page ─── */
export default function ObjetivoAnalisePage() {
  const router = useRouter();
  const [obj, setObj] = useState<Objective | null>(null);
  const [analytics, setAnalytics] = useState<ObjectiveAnalyticsData | null>(null);

  /* JARVAR state */
  const [history, setHistory] = useState<JarvarAnalysis[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<JarvarAnalysis | null>(null);
  const [userContext, setUserContext] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.objetivoAtual);
      if (!raw) {
        router.replace("/dashboard/categoria");
        return;
      }
      const parsed = JSON.parse(raw) as Objective;
      setObj(parsed);
      setHistory(loadHistory(parsed.id));

      const loadAnalytics = async () => {
        // TODO (backend): desenvolver endpoint autenticado que retorne `weeklyProgress` (evolução semanal) por objetivo; substituir mock abaixo.
        // TODO (backend): desenvolver endpoint autenticado que retorne `tasksByPriority` (gráfico de prioridade) por objetivo; substituir mock abaixo.
        const mockPromise = fetch(`/api/mock/objetivo-analise/${parsed.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d as ObjectiveAnalyticsData | null)
          .catch(() => null);

        let jwtToken = "";
        try {
          jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
        } catch {
          /* ignore */
        }

        const cancelPromise = jwtToken
          ? fetchCancellationReasons(parsed.id, jwtToken)
          : Promise.resolve({ kind: "skipped_no_token" as const });

        const [mockData, cancelRes] = await Promise.all([mockPromise, cancelPromise]);
        if (cancelled) return;

        if (cancelRes.kind === "unauthorized") {
          router.push("/login");
          window.alert("Você não está logado, por favor faça login novamente.");
          return;
        }

        const base = mockData ?? emptyObjectiveAnalytics;

        if (cancelRes.kind === "ok") {
          setAnalytics({ ...base, cancellationReasons: cancelRes.reasons });
        } else {
          // `skipped_no_token` | `http_error` | `network_error` — mantém `cancellationReasons` do mock quando existir.
          // TODO (contract): sem token — redirecionar para `/login` se a rota exigir sempre autenticação.
          // TODO (contract): `http_error` / `network_error` — toast e retry; não sobrescrever com lista vazia se o mock tiver dados.
          setAnalytics(base);
        }
      };

      void loadAnalytics();
    } catch {
      router.replace("/dashboard/categoria");
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  const runAnalysis = useCallback(async () => {
    if (!obj) return;
    setAnalyzing(true);
    setCurrentAnalysis(null);
    try {
      let jwtToken = "";
      try {
        jwtToken = String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
      } catch {
        /* ignore */
      }

      if (!jwtToken) {
        // TODO (contract): fluxo sem token — redirecionar para `/login` em vez de só alerta.
        window.alert("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const payload = buildDashboardIaRequestBody(obj, {
        userContext,
        selectedHistory,
        history,
      });

      const result = await postDashboardIa(jwtToken, payload);

      if (result.kind === "unauthorized") {
        router.push("/login");
        window.alert("Você não está logado, por favor faça login novamente.");
        return;
      }

      if (result.kind !== "ok") {
        // TODO (contract): mensagem do corpo em 4xx/5xx quando padronizada; retry para 503/429.
        window.alert("Não foi possível gerar a análise. Tente novamente.");
        return;
      }

      const responseText = result.responseText;

      const newEntry: JarvarAnalysis = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        objectiveId: obj.id,
        createdAt: new Date().toISOString(),
        userContext: userContext.trim(),
        response: responseText,
        objectiveSnapshot: obj,
      };

      const updated = [newEntry, ...history].slice(0, 10);
      setHistory(updated);
      saveHistory(obj.id, updated);
      setCurrentAnalysis(responseText);
      setUserContext("");
      setSelectedHistory(null);

      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      window.alert("Falha de conexão. Verifique sua internet.");
    } finally {
      setAnalyzing(false);
    }
  }, [obj, userContext, selectedHistory, history, router]);

  if (!obj) {
    return (
      <div className="mx-auto max-w-4xl pt-4">
        <p className="text-[var(--text-muted)]">Carregando objetivo…</p>
      </div>
    );
  }

  const total = obj.totNumberTasks ?? 0;
  const done = obj.numberTasksDone ?? 0;
  const inProgress = obj.numberTasksInProgress ?? 0;
  const toDo = obj.numberTasksToDo ?? 0;
  const overdue = obj.numberTasksOverdue ?? 0;
  const cancelled = obj.numberTasksCancelled ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : obj.statusObjective === "DONE" ? 100 : 0;

  const pieData = [
    { name: "Concluídas", value: done, color: COLORS.done },
    { name: "Em andamento", value: inProgress, color: COLORS.inProgress },
    { name: "A fazer", value: toDo, color: COLORS.toDo },
    { name: "Atrasadas", value: overdue, color: COLORS.overdue },
    { name: "Canceladas", value: cancelled, color: COLORS.cancelled },
  ].filter((d) => d.value > 0);

  const radarData = [
    { subject: "Conclusão", value: pct },
    { subject: "Pontualidade", value: total > 0 ? Math.max(0, Math.round(((total - overdue) / total) * 100)) : 100 },
    { subject: "Execução", value: total > 0 ? Math.round(((done + inProgress) / total) * 100) : 0 },
    { subject: "Foco", value: total > 0 ? Math.max(0, Math.round(((total - cancelled) / total) * 100)) : 100 },
    { subject: "Ritmo", value: total > 0 ? Math.min(100, Math.round((done / Math.max(1, obj.totNumberTasks ?? 1)) * 120)) : 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-4 md:pt-6">
      {/* ── Cabeçalho ── */}
      <div>
        <Link href="/dashboard/categoria" className="text-sm text-brand-cyan underline-offset-4 hover:underline">
          ← Voltar à categoria
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            {obj.nameObjective}
          </h1>
          <span
            className={cn(
              "shrink-0 rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wide",
              obj.statusObjective === "DONE"
                ? "bg-emerald-400/15 text-emerald-400"
                : "bg-brand-cyan/15 text-brand-cyan"
            )}
          >
            {obj.statusObjective === "DONE" ? "Concluído" : "Em andamento"}
          </span>
        </div>
        {obj.descriptionObjective && (
          <p className="mt-2 text-[var(--text-muted)]">{obj.descriptionObjective}</p>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Concluídas" value={done} icon={CheckCircleIcon} color="text-emerald-400" bg="bg-emerald-400/8" />
        <StatCard label="Em andamento" value={inProgress} icon={ClockIcon} color="text-brand-cyan" bg="bg-brand-cyan/8" />
        <StatCard label="A fazer" value={toDo} icon={QueueListIcon} color="text-brand-blue" bg="bg-brand-blue/8" />
        <StatCard label="Atrasadas" value={overdue} icon={ExclamationTriangleIcon} color="text-brand-pink" bg="bg-brand-pink/8" />
        <StatCard label="Canceladas" value={cancelled} icon={XCircleIcon} color="text-[var(--text-muted)]" bg="bg-[var(--glass-bg)]" />
      </div>

      {/* ── Gráficos ── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* 1 – Tarefas por status (Pie) */}
        <GlassCard>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tarefas por status
          </h2>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">Sem tarefas registradas</p>
          )}
        </GlassCard>

        {/* 2 – Radar de performance */}
        <GlassCard>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Radar de performance
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke={COLORS.inProgress}
                fill={COLORS.inProgress}
                fillOpacity={0.25}
                dot={{ r: 3, fill: COLORS.inProgress }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* 3 – Progresso semanal (Area chart) — TODO (backend): dados reais via endpoint de evolução semanal */}
        {analytics && (
          <GlassCard className="md:col-span-2">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Evolução semanal
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.weeklyProgress} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.done} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.done} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.added} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.added} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCancelled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.overdue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.overdue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span>} />
                <Area type="monotone" dataKey="done" name="Concluídas" stroke={COLORS.done} fill="url(#gradDone)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="added" name="Adicionadas" stroke={COLORS.added} fill="url(#gradAdded)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="cancelled" name="Canceladas" stroke={COLORS.overdue} fill="url(#gradCancelled)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* 4 – Motivos de cancelamento (Bar horizontal) */}
        {analytics && analytics.cancellationReasons.length > 0 && (
          <GlassCard>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Motivos de cancelamento
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={analytics.cancellationReasons}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 10, fill: "var(--text-muted)" }} width={115} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Ocorrências" fill={COLORS.overdue} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* 5 – Tarefas por prioridade (Bar) — TODO (backend): dados reais via endpoint de prioridade */}
        {analytics && (
          <GlassCard>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Tarefas por prioridade
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.tasksByPriority} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tarefas" radius={[6, 6, 0, 0]}>
                  {analytics.tasksByPriority.map((entry, index) => (
                    <Cell
                      key={entry.priority}
                      fill={[COLORS.overdue, COLORS.inProgress, COLORS.toDo][index % 3]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}
      </div>

      {/* ── JARVAR ── */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple/40 to-brand-pink/30 text-white">
            <SparklesIcon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[var(--text-primary)]">Jarvas (IA)</h2>
            {/* <p className="text-xs text-[var(--text-muted)]">
              Fase 2: <code className="rounded bg-black/5 px-1 dark:bg-white/10">POST /auth/api/dashboard/ia</code>
            </p> */}
          </div>
        </div>

        {/* histórico */}
        <JarvarHistoryPanel
          history={history}
          onSelect={setSelectedHistory}
          selected={selectedHistory}
        />

        {/* resultado atual */}
        <AnimatePresence>
          {currentAnalysis && (
            <motion.div
              ref={analysisRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease }}
              className="mb-4 rounded-xl border border-[var(--glass-border)] bg-gradient-to-br from-brand-purple/8 to-brand-pink/5 p-4"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-cyan">
                Nova análise
              </p>
              <AnalysisText text={currentAnalysis} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* input de contexto + botão */}
        <div className="flex flex-col gap-3">
          <textarea
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            rows={3}
            placeholder={
              selectedHistory
                ? "Descreva o que mudou desde a análise anterior…"
                : "Adicione contexto para a análise (opcional): o que mudou, bloqueios atuais, foco desta semana…"
            }
            className={cn(
              "w-full resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3",
              "text-sm text-[var(--text-primary)] backdrop-blur-glass placeholder:text-[var(--text-muted)]",
              "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
              "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none"
            )}
          />
          <Button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing}
            className="w-full sm:w-auto sm:self-end"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analisando…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" aria-hidden />
                {selectedHistory ? "Nova análise com contexto anterior" : "Analisar objetivo"}
              </span>
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
