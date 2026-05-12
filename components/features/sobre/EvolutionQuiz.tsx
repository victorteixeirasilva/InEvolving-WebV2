"use client";

import * as React from "react";
import { AnimatePresence, motion, animate, useInView } from "framer-motion";
import { buildWhatsAppMessageUrl } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

const waQuizResult = buildWhatsAppMessageUrl(
  "Olá! Fiz o quiz de evolução do InEvolving e quero começar meu plano personalizado. Quero aproveitar os 30 dias grátis!"
);

// ─── Types ─────────────────────────────────────────────────────────────────────

type GoalKey =
  | "intellectual"
  | "financial"
  | "career"
  | "productivity"
  | "health"
  | "entrepreneur";

type Option = { value: string; icon: string; label: string; desc?: string };

type Answer = { questionId: string; value: string };

type QuizPhase = "intro" | "quiz" | "loading" | "result";

type QuizState = {
  phase: QuizPhase;
  currentStep: number;
  answers: Answer[];
  direction: 1 | -1;
};

type QuizAction =
  | { type: "START" }
  | { type: "ANSWER"; questionId: string; value: string }
  | { type: "BACK" }
  | { type: "LOADING_DONE" }
  | { type: "RESTART" };

// ─── Quiz Data ─────────────────────────────────────────────────────────────────

const GOAL_OPTIONS: Option[] = [
  { value: "intellectual", icon: "🧠", label: "Evoluir intelectualmente", desc: "Leituras, cursos e conhecimento" },
  { value: "financial",    icon: "💰", label: "Evoluir financeiramente",  desc: "Controle, renda e patrimônio" },
  { value: "career",       icon: "🚀", label: "Avançar na carreira",      desc: "Promoção, autoridade e crescimento" },
  { value: "productivity", icon: "⚡", label: "Aumentar minha produtividade", desc: "Foco, organização e execução" },
  { value: "health",       icon: "🏃", label: "Melhorar saúde e bem-estar", desc: "Hábitos, energia e equilíbrio" },
  { value: "entrepreneur", icon: "🏢", label: "Crescer como empreendedor", desc: "Estratégia, time e resultados" },
];

const Q2_BY_GOAL: Record<GoalKey, Option[]> = {
  intellectual: [
    { value: "reading",  icon: "📚", label: "Leituras e livros" },
    { value: "courses",  icon: "🎓", label: "Cursos e certificações" },
    { value: "languages",icon: "🌍", label: "Idiomas" },
    { value: "practical",icon: "🔧", label: "Projetos práticos e portfólio" },
  ],
  financial: [
    { value: "control", icon: "📊", label: "Controlar meus gastos" },
    { value: "income",  icon: "📈", label: "Aumentar minha renda" },
    { value: "invest",  icon: "💎", label: "Começar a investir" },
    { value: "debt",    icon: "⚖️", label: "Sair das dívidas" },
  ],
  career: [
    { value: "promotion", icon: "🏆", label: "Conquistar uma promoção" },
    { value: "change",    icon: "🔄", label: "Mudar de área ou empresa" },
    { value: "authority", icon: "🎯", label: "Construir autoridade no mercado" },
    { value: "skills",    icon: "🛠️", label: "Aprender novas habilidades" },
  ],
  productivity: [
    { value: "tasks",         icon: "📋", label: "Excesso de tarefas acumuladas" },
    { value: "procrastination",icon: "⏰", label: "Procrastinação e adiamentos" },
    { value: "focus",         icon: "🎯", label: "Falta de foco e distrações" },
    { value: "meetings",      icon: "💬", label: "Reuniões e interrupções demais" },
  ],
  health: [
    { value: "exercise",   icon: "💪", label: "Criar rotina de exercícios" },
    { value: "nutrition",  icon: "🥗", label: "Melhorar alimentação" },
    { value: "mental",     icon: "🧘", label: "Saúde mental e mindfulness" },
    { value: "sleep",      icon: "😴", label: "Melhorar o sono e energia" },
  ],
  entrepreneur: [
    { value: "strategy", icon: "♟️", label: "Estratégia e planejamento" },
    { value: "team",     icon: "👥", label: "Gestão de time e processos" },
    { value: "sales",    icon: "📣", label: "Vendas e crescimento" },
    { value: "product",  icon: "🔑", label: "Produto e entrega de valor" },
  ],
};

const STATIC_QUESTIONS: { id: string; title: string; options: Option[] }[] = [
  {
    id: "situation",
    title: "Como você descreveria sua situação atual?",
    options: [
      { value: "zero",      icon: "🌱", label: "Começo do zero",         desc: "Sem hábitos estabelecidos ainda" },
      { value: "some",      icon: "🔄", label: "Tenho alguma rotina",    desc: "Mas falta consistência" },
      { value: "organized", icon: "📐", label: "Sou organizado",         desc: "Mas sem método claro" },
      { value: "method",    icon: "⚙️", label: "Tenho método",           desc: "Mas não consigo manter a constância" },
    ],
  },
  {
    id: "obstacle",
    title: "Qual é o seu maior obstáculo hoje?",
    options: [
      { value: "time",       icon: "⏱️", label: "Falta de tempo",              desc: "O dia acaba antes do que preciso fazer" },
      { value: "focus",      icon: "🌀", label: "Falta de foco",               desc: "Muitas distrações me tiram do trilho" },
      { value: "motivation", icon: "🔋", label: "Procrastinação",              desc: "Fico adiando o que importa" },
      { value: "start",      icon: "🗺️", label: "Não sei por onde começar",    desc: "Falta de direção clara" },
    ],
  },
  {
    id: "style",
    title: "Como você trabalha melhor?",
    options: [
      { value: "lists",     icon: "📝", label: "Listas e passo a passo",      desc: "Preciso de estrutura clara" },
      { value: "visual",    icon: "🗂️", label: "Visualmente",                 desc: "Quadros, kanban e mapas mentais" },
      { value: "deadlines", icon: "🗓️", label: "Metas e prazos",              desc: "Funciono com compromissos definidos" },
      { value: "flexible",  icon: "🌊", label: "Com liberdade e flexibilidade",desc: "Adapto conforme o dia" },
    ],
  },
  {
    id: "time",
    title: "Quanto tempo você consegue investir por dia?",
    options: [
      { value: "15min", icon: "⚡", label: "15 minutos",      desc: "Micro-hábitos poderosos" },
      { value: "30min", icon: "🕐", label: "30 minutos",      desc: "Uma sessão focada" },
      { value: "1h",    icon: "🕑", label: "1 hora",          desc: "Progresso consistente" },
      { value: "more",  icon: "🔥", label: "Mais de 1 hora",  desc: "Velocidade máxima" },
    ],
  },
  {
    id: "commitment",
    title: "Qual é o seu nível de comprometimento?",
    options: [
      { value: "test",      icon: "🧪", label: "Quero testar sem pressão",        desc: "Vou ver se funciona para mim" },
      { value: "some",      icon: "🌱", label: "Disposto a mudar alguns hábitos", desc: "Com calma e consistência" },
      { value: "committed", icon: "💪", label: "Comprometido com mudança real",   desc: "Estou pronto para agir" },
      { value: "total",     icon: "🔥", label: "Transformação total",             desc: "Custe o que custar" },
    ],
  },
];

// ─── Result Engine ─────────────────────────────────────────────────────────────

const PROFILE_NAMES: Record<GoalKey, [string, string, string, string]> = {
  intellectual: ["O Explorador do Conhecimento", "O Estudioso Consistente",     "O Intelectual Estratégico", "O Aprendiz Imparável"],
  financial:    ["O Organizador Financeiro",      "O Construtor de Patrimônio",  "O Dominador Financeiro",   "O Investidor de Elite"],
  career:       ["O Desenvolvedor Profissional",  "O Escalador de Carreira",     "O Construtor de Autoridade","O Transformador de Carreira"],
  productivity: ["O Organizador Iniciante",       "O Otimizador de Tempo",       "O Mestre da Execução",     "O Sistema Perfeito"],
  health:       ["O Bem-Estar Consistente",       "O Equilíbrio Inteligente",    "O Atleta da Vida",         "O Novo Eu"],
  entrepreneur: ["O Builder Estratégico",         "O Empreendedor Organizado",   "O Fundador de Alto Impacto","O Visionário Implacável"],
};

const PROFILE_PHRASES: Record<GoalKey, [string, string, string, string]> = {
  intellectual: [
    "Você tem curiosidade — falta sistema para transformá-la em conhecimento aplicado.",
    "Sua sede de aprendizado é real. Com o método certo, cada hora estudada vira resultado.",
    "Você aprende rápido. O InEvolving vai organizar esse potencial em evolução mensurável.",
    "Seu ritmo de aprendizado vai superar 94% das pessoas com as ferramentas certas.",
  ],
  financial: [
    "Você sente que o dinheiro some sem saber onde vai. Vamos mudar isso.",
    "Com clareza financeira, cada real trabalha por você. Seu plano começa aqui.",
    "Você vai transformar sua relação com dinheiro em 60 dias — com método e dados.",
    "Sua disciplina financeira vai gerar um patrimônio que fala por você.",
  ],
  career: [
    "Seu potencial profissional ainda não foi totalmente aproveitado. Isso muda agora.",
    "Com objetivos claros e execução consistente, sua carreira vai dar um salto visível.",
    "Você vai construir a reputação profissional que sempre quis — passo a passo.",
    "Em 60 dias, você vai ter evidências concretas da sua evolução profissional.",
  ],
  productivity: [
    "Você produz muito, mas ainda não no que importa. Vamos alinhar foco e resultado.",
    "Com o sistema certo, você vai fazer mais em 4 horas do que hoje faz em 8.",
    "Sua capacidade de execução vai dobrar quando o método entrar no lugar.",
    "Você vai operar em modo elite — com clareza, velocidade e zero desperdício.",
  ],
  health: [
    "Cada passo conta. Seu corpo e mente vão te agradecer por começar hoje.",
    "Hábitos saudáveis não precisam de força de vontade — precisam de sistema.",
    "Sua energia vai triplicar quando rotina e saúde andarem juntas.",
    "Você vai se reconhecer em 60 dias — e gostar muito do que vai ver.",
  ],
  entrepreneur: [
    "Sua ideia merece um sistema que a faça crescer de forma organizada.",
    "Empreendedor com método cresce 3× mais rápido. Seu plano começa aqui.",
    "Você vai construir processos que funcionam mesmo quando você não está presente.",
    "Em 60 dias, seu negócio vai operar em outro nível — com estratégia e dados.",
  ],
};

type TimelineItem = {
  day: string;
  title: string;
  bullets: string[];
  feature: string;
  featureIcon: string;
};

const TIMELINE_DATA: Record<GoalKey, [TimelineItem, TimelineItem, TimelineItem]> = {
  intellectual: [
    { day: "7 dias",  title: "Biblioteca organizada, leitura no trilho", featureIcon: "📚", feature: "Livros & Aprendizado",    bullets: ["Primeiros livros cadastrados no módulo Livros", "Meta de leitura semanal criada como objetivo", "Rotina de 15–30 min/dia ativada"] },
    { day: "30 dias", title: "Conhecimento virando hábito diário",        featureIcon: "📊", feature: "Dashboard + Categorias", bullets: ["4+ livros ou módulos concluídos", "Anotações e insights organizados por categoria", "Progresso visível no dashboard"] },
    { day: "60 dias", title: "Evolução intelectual comprovada",           featureIcon: "🎯", feature: "Motivação & Sonhos",     bullets: ["Biblioteca pessoal construída", "Conhecimento aplicado em projetos reais", "Portfólio de aprendizado para o mercado"] },
  ],
  financial: [
    { day: "7 dias",  title: "Raio-X financeiro completo",          featureIcon: "💰", feature: "Finanças",              bullets: ["Entradas e saídas do mês mapeadas", "Primeiro painel financeiro configurado", "Metas de economia criadas"] },
    { day: "30 dias", title: "Controle real do seu dinheiro",        featureIcon: "📈", feature: "Finanças + Dashboard", bullets: ["Gastos desnecessários identificados e cortados", "Meta de reserva de emergência em andamento", "Relatório do período mostrando evolução"] },
    { day: "60 dias", title: "Novo padrão financeiro instalado",     featureIcon: "💎", feature: "Categorias + Finanças", bullets: ["Hábito de registro financeiro consolidado", "Primeiro investimento ou reserva em construção", "Clareza total sobre para onde o dinheiro vai"] },
  ],
  career: [
    { day: "7 dias",  title: "Plano de carreira estruturado",        featureIcon: "🚀", feature: "Tarefas & Kanban",      bullets: ["Objetivos profissionais mapeados no Kanban", "Primeiras tarefas de desenvolvimento criadas", "Meta de curto prazo definida com prazo"] },
    { day: "30 dias", title: "Execução consistente e visível",        featureIcon: "🏆", feature: "Dashboard + Objetivos", bullets: ["Projetos estratégicos avançando no Kanban", "Habilidades sendo desenvolvidas ativamente", "Progresso documentado no dashboard"] },
    { day: "60 dias", title: "Carreira em outro patamar",             featureIcon: "⭐", feature: "Categorias + Motivação",bullets: ["Evidências concretas de crescimento acumuladas", "Reputação profissional sendo construída", "Próximo passo de carreira mapeado"] },
  ],
  productivity: [
    { day: "7 dias",  title: "Caos transformado em sistema",         featureIcon: "⚡", feature: "Tarefas & Kanban",      bullets: ["Todas as tarefas capturadas e organizadas", "Prioridades claras definidas por categoria", "Primeira rotina diária estruturada"] },
    { day: "30 dias", title: "Foco e execução no automático",         featureIcon: "🎯", feature: "Dashboard + Pomodoro", bullets: ["Taxa de conclusão acima de 80%", "Backlog zerado semanalmente", "2h+ por dia recuperadas"] },
    { day: "60 dias", title: "Produtividade de elite instalada",      featureIcon: "🔥", feature: "Categorias + Objetivos",bullets: ["Sistema pessoal rodando de forma autônoma", "Resultados entregues com consistência", "Energia e foco preservados ao longo do dia"] },
  ],
  health: [
    { day: "7 dias",  title: "Primeiros hábitos no lugar",           featureIcon: "🏃", feature: "Tarefas Recorrentes",   bullets: ["Rotina de saúde criada como categoria", "Hábitos registrados como tarefas recorrentes", "Metas semanais de bem-estar definidas"] },
    { day: "30 dias", title: "Rotina saudável se consolidando",       featureIcon: "💪", feature: "Objetivos + Dashboard", bullets: ["Consistência de 70%+ nos hábitos planejados", "Energia perceptivelmente diferente", "Progresso visível no painel de objetivos"] },
    { day: "60 dias", title: "Transformação visível e sentida",       featureIcon: "✨", feature: "Motivação & Sonhos",    bullets: ["Hábito de saúde automático e sustentável", "Bem-estar impactando produtividade e humor", "Novo patamar de energia instalado"] },
  ],
  entrepreneur: [
    { day: "7 dias",  title: "Estratégia e execução alinhadas",      featureIcon: "♟️", feature: "Dashboard + Kanban",       bullets: ["Objetivos do negócio mapeados por categoria", "Primeiras tarefas estratégicas no Kanban", "Dashboard do negócio configurado"] },
    { day: "30 dias", title: "Processos e time rodando",              featureIcon: "👥", feature: "Categorias Colaborativas", bullets: ["Fluxo de trabalho documentado e seguido", "Time alinhado com objetivos compartilhados", "Métricas de negócio visíveis no dashboard"] },
    { day: "60 dias", title: "Negócio em outro nível",                featureIcon: "🏆", feature: "Finanças + Objetivos",     bullets: ["Processos rodando sem depender de você 100%", "Crescimento de receita mapeado", "Visão estratégica clara para os próximos 90 dias"] },
  ],
};

const SCORE_COMMITMENT: Record<string, number> = { test: 0, some: 8, committed: 15, total: 22 };
const SCORE_TIME:       Record<string, number> = { "15min": 0, "30min": 5, "1h": 10, more: 15 };
const SCORE_SITUATION:  Record<string, number> = { zero: 0, some: 5, organized: 8, method: 10 };
const COMMITMENT_IDX:   Record<string, number> = { test: 0, some: 1, committed: 2, total: 3 };

function getResult(answers: Answer[]) {
  const goal       = (answers.find((a) => a.questionId === "goal")?.value ?? "productivity") as GoalKey;
  const commitment = answers.find((a) => a.questionId === "commitment")?.value ?? "some";
  const time       = answers.find((a) => a.questionId === "time")?.value ?? "30min";
  const situation  = answers.find((a) => a.questionId === "situation")?.value ?? "some";

  const idx         = COMMITMENT_IDX[commitment] ?? 1;
  const profileName = PROFILE_NAMES[goal][idx];
  const phrase      = PROFILE_PHRASES[goal][idx];
  const timeline    = TIMELINE_DATA[goal];
  const score       = Math.min(97, 55 + (SCORE_COMMITMENT[commitment] ?? 0) + (SCORE_TIME[time] ?? 0) + (SCORE_SITUATION[situation] ?? 0));

  const goalMeta = GOAL_OPTIONS.find((g) => g.value === goal);

  const features: { icon: string; label: string }[] = [
    { icon: "📊", label: "Dashboard" },
    { icon: "✅", label: "Tarefas" },
    { icon: "🗂️", label: "Kanban" },
    { icon: "🎯", label: "Objetivos" },
  ];
  if (goal === "financial" || goal === "entrepreneur") features.push({ icon: "💰", label: "Finanças" });
  if (goal === "intellectual") features.push({ icon: "📚", label: "Livros" });
  features.push({ icon: "✨", label: "Motivação" });

  const metrics = [
    { label: "Clareza de objetivos",       value: Math.min(98, score + 8), color: "cyan"   },
    { label: "Consistência de execução",   value: Math.min(96, score + 2), color: "purple" },
    { label: "Velocidade de evolução",     value: Math.min(94, score - 5), color: "pink"   },
  ];

  return { profileName, phrase, score, timeline, features, metrics, goalIcon: goalMeta?.icon ?? "🚀", goalLabel: goalMeta?.label ?? "Evolução" };
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START":
      return { ...state, phase: "quiz", currentStep: 0 };
    case "ANSWER": {
      const nextStep = state.currentStep + 1;
      return {
        ...state,
        answers: [
          ...state.answers.filter((a) => a.questionId !== action.questionId),
          { questionId: action.questionId, value: action.value },
        ],
        currentStep: nextStep,
        direction: 1,
        phase: nextStep >= TOTAL_STEPS ? "loading" : "quiz",
      };
    }
    case "BACK":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1), direction: -1 };
    case "LOADING_DONE":
      return { ...state, phase: "result" };
    case "RESTART":
      return { phase: "intro", currentStep: 0, answers: [], direction: 1 };
    default:
      return state;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function QuizWaLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold",
        "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow",
        "transition-all duration-[380ms] hover:shadow-glass-lg hover:scale-[1.02]",
        "dark:from-brand-purple dark:to-brand-pink dark:shadow-glow-pink/40",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

function ProgressBar({ step, total, reduce }: { step: number; total: number; reduce: boolean }) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Pergunta {step + 1} de {total}</span>
        <span className="font-mono font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan dark:from-brand-purple dark:to-brand-pink"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function QuizStep({
  questionId, title, options, selected, onSelect, onBack, step, total, reduce, direction,
}: {
  questionId: string; title: string; options: Option[]; selected?: string;
  onSelect: (v: string) => void; onBack?: () => void;
  step: number; total: number; reduce: boolean; direction: 1 | -1;
}) {
  const isWide = options.length === 6;
  return (
    <div className="w-full">
      <ProgressBar step={step} total={total} reduce={reduce} />
      <motion.div
        key={questionId}
        initial={reduce ? false : { opacity: 0, x: direction * 48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? undefined : { opacity: 0, x: direction * -48 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h3 className="mb-6 text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h3>
        <div className={`grid gap-3 ${isWide ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
          {options.map((opt, i) => {
            const isSelected = selected === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.055, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className={[
                  "group relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-300",
                  isSelected
                    ? "border-brand-cyan/70 bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10 shadow-glow dark:border-brand-pink/60 dark:from-brand-purple/15 dark:to-brand-pink/10"
                    : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-brand-cyan/40 hover:bg-brand-blue/5 dark:hover:border-brand-pink/35",
                ].join(" ")}
              >
                {isSelected && (
                  <motion.span
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan text-[10px] text-white dark:from-brand-purple dark:to-brand-pink"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  >
                    ✓
                  </motion.span>
                )}
                <span className="text-2xl leading-none">{opt.icon}</span>
                <span className="font-semibold text-[var(--text-primary)]">{opt.label}</span>
                {opt.desc && <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>}
              </motion.button>
            );
          })}
        </div>
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="mt-5 flex items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            ← Voltar
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

const LOADING_LINES = [
  "Analisando seu perfil...",
  "Mapeando seu potencial de evolução...",
  "Calibrando marcos de 7, 30 e 60 dias...",
  "Selecionando ferramentas ideais para você...",
  "Gerando seu plano personalizado...",
];

function LoadingScreen({ onDone, reduce }: { onDone: () => void; reduce: boolean }) {
  const [progress, setProgress] = React.useState(0);
  const [lineIdx, setLineIdx]   = React.useState(0);
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;

  React.useEffect(() => {
    const DURATION = 2800;
    const TICK     = 45;
    const steps    = DURATION / TICK;
    let current    = 0;

    const prog = setInterval(() => {
      current += 1;
      setProgress(Math.min(100, Math.round((current / steps) * 100)));
      if (current >= steps) { clearInterval(prog); onDoneRef.current(); }
    }, TICK);

    const lineTimer = setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, LOADING_LINES.length - 1));
    }, DURATION / LOADING_LINES.length);

    return () => { clearInterval(prog); clearInterval(lineTimer); };
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-8 py-16 text-center"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Orb */}
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan dark:from-brand-purple dark:to-brand-pink"
          animate={reduce ? undefined : { scale: [1, 1.18, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-brand-cyan/50 dark:border-brand-pink/50"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
      </div>

      {/* Text lines */}
      <div className="min-h-[120px] space-y-2">
        {LOADING_LINES.slice(0, lineIdx + 1).map((line, i) => (
          <motion.p
            key={line}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: i === lineIdx ? 1 : 0.3, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`text-sm font-medium ${i === lineIdx ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
          >
            {i < lineIdx && <span className="mr-1 text-brand-cyan dark:text-brand-pink">✓</span>}
            {line}
          </motion.p>
        ))}
      </div>

      {/* Progress */}
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex justify-between font-mono text-xs text-[var(--text-muted)]">
          <span>Processando</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple dark:from-brand-purple dark:via-brand-pink dark:to-brand-cyan"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.08, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ScoreCounter({ target, reduce }: { target: number; reduce: boolean }) {
  const [display, setDisplay] = React.useState(0);
  const ref    = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(target); return; }
    const ctrl = animate(0, target, {
      duration: 1.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [inView, target, reduce]);

  return <span ref={ref}>{display}</span>;
}

function MetricBar({ label, value, color, delay, reduce }: {
  label: string; value: number; color: string; delay: number; reduce: boolean;
}) {
  const ref    = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) { setCount(value); return; }
    const t = setTimeout(() => {
      const ctrl = animate(0, value, {
        duration: 1.4,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (v) => setCount(Math.round(v)),
      });
      return () => ctrl.stop();
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [inView, value, delay, reduce]);

  const gradClass =
    color === "cyan"   ? "from-brand-blue to-brand-cyan"
    : color === "purple" ? "from-brand-purple to-brand-cyan dark:from-brand-purple dark:to-brand-pink"
    :                      "from-brand-pink to-brand-purple";

  return (
    <div ref={ref}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{count}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--glass-border)]">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradClass}`}
          initial={{ width: "0%" }}
          animate={{ width: inView ? `${value}%` : "0%" }}
          transition={{ duration: reduce ? 0.3 : 1.4, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ─── Intro Screen ──────────────────────────────────────────────────────────────

function IntroScreen({ onStart, reduce }: { onStart: () => void; reduce: boolean }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-8 px-4 py-14 text-center md:py-20">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-blue/18 via-brand-cyan/12 to-brand-purple/18 blur-3xl dark:from-brand-purple/22 dark:via-brand-pink/12 dark:to-brand-blue/18"
        aria-hidden
        animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative space-y-4"
      >
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-cyan dark:text-brand-pink">
          Quiz de evolução personalizada
        </p>
        <h2 className="text-balance text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
          Qual versão de você{" "}
          <span
            className="bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-shift dark:from-brand-purple dark:via-brand-pink dark:to-brand-cyan"
            style={{ WebkitBackgroundClip: "text" }}
          >
            você quer ser?
          </span>
        </h2>
        <p className="mx-auto max-w-xl text-base text-[var(--text-muted)] sm:text-lg">
          Responda 7 perguntas e receba um plano personalizado — com o que você vai conquistar em{" "}
          <strong className="text-[var(--text-primary)]">7, 30 e 60 dias</strong> usando o InEvolving.
        </p>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap justify-center gap-2"
      >
        {["7 perguntas", "Plano 7/30/60 dias", "100% gratuito", "Resultado instantâneo"].map((b) => (
          <span key={b} className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] backdrop-blur-glass">
            {b}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.button
          type="button"
          onClick={onStart}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-blue to-brand-cyan px-8 py-4 text-base font-bold text-white shadow-glow transition-all duration-300 hover:shadow-glass-lg dark:from-brand-purple dark:to-brand-pink"
          whileHover={reduce ? undefined : { scale: 1.04 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
        >
          {!reduce && (
            <motion.span
              className="pointer-events-none absolute inset-0 bg-white/20"
              initial={{ x: "-110%", skewX: "-15deg" }}
              whileHover={{ x: "210%" }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
            />
          )}
          <span className="relative z-10">Descobrir meu plano de evolução →</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({ answers, onRestart, reduce }: { answers: Answer[]; onRestart: () => void; reduce: boolean }) {
  const result = React.useMemo(() => getResult(answers), [answers]);

  return (
    <motion.div
      className="w-full space-y-6"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header: perfil + score ── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-cyan/40 bg-gradient-to-br from-brand-blue/8 via-[var(--glass-bg)] to-brand-purple/8 p-6 backdrop-blur-glass dark:border-brand-pink/30 dark:from-brand-purple/12 dark:to-brand-pink/8">
        <motion.div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-cyan/18 to-brand-blue/8 blur-3xl dark:from-brand-pink/18 dark:to-brand-purple/8"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], rotate: [0, 18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 min-w-0">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-cyan dark:text-brand-pink">
              Seu perfil de evolução
            </p>
            <div className="flex items-center gap-3">
              <motion.span
                className="shrink-0 text-4xl"
                animate={reduce ? undefined : { rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2.2, delay: 0.9, ease: "easeInOut" }}
              >
                {result.goalIcon}
              </motion.span>
              <h3 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {result.profileName}
              </h3>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
              {result.phrase}
            </p>
          </div>

          {/* Score */}
          <motion.div
            className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 text-center"
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Potencial</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums text-[var(--text-primary)]">
              <ScoreCounter target={result.score} reduce={reduce} />
              <span className="text-lg font-medium text-[var(--text-muted)]">/100</span>
            </p>
            <div className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-[var(--glass-border)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan dark:from-brand-purple dark:to-brand-pink"
                initial={{ width: "0%" }}
                animate={{ width: `${result.score}%` }}
                transition={{ duration: reduce ? 0.3 : 1.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Timeline 7 / 30 / 60 ── */}
      <div>
        <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-brand-purple dark:text-brand-pink">
          Sua evolução semana a semana
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {result.timeline.map((item, i) => {
            const badgeClass =
              i === 0 ? "bg-brand-blue dark:bg-brand-purple"
              : i === 1 ? "bg-brand-cyan/90 dark:bg-brand-pink/90"
              : "bg-gradient-to-r from-brand-purple to-brand-cyan dark:from-brand-pink dark:to-brand-purple";

            return (
              <motion.div
                key={item.day}
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 backdrop-blur-glass"
              >
                {/* Connector line on desktop */}
                {i < 2 && (
                  <div className="absolute -right-2 top-6 z-10 hidden h-0.5 w-4 md:block">
                    <div className="h-full w-full bg-[var(--glass-border)]" />
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-cyan to-brand-purple dark:from-brand-pink dark:to-brand-purple"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      style={{ transformOrigin: "left" }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold text-white ${badgeClass}`}>
                    {item.day}
                  </span>
                  <span className="text-lg">{item.featureIcon}</span>
                </div>
                <h4 className="mb-3 font-bold leading-tight text-[var(--text-primary)]">{item.title}</h4>
                <ul className="space-y-1.5">
                  {item.bullets.map((b, bi) => (
                    <motion.li
                      key={b}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.12 + bi * 0.07 + 0.2 }}
                      className="flex items-start gap-2 text-xs text-[var(--text-muted)]"
                    >
                      <span className="mt-0.5 shrink-0 text-brand-cyan dark:text-brand-pink">✓</span>
                      {b}
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg border border-[var(--glass-border)] bg-brand-blue/5 px-2.5 py-1.5 text-xs font-medium text-brand-blue dark:bg-brand-purple/10 dark:text-brand-pink">
                  Usa: {item.feature}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Kit de ferramentas ── */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 backdrop-blur-glass">
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand-blue dark:text-brand-cyan">
          Ferramentas do seu plano
        </p>
        <div className="flex flex-wrap gap-2">
          {result.features.map((f, i) => (
            <motion.span
              key={f.label}
              initial={reduce ? false : { opacity: 0, scale: 0.75 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.32, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-glass"
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </motion.span>
          ))}
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 backdrop-blur-glass">
        <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Seu impacto estimado em 60 dias
        </p>
        <div className="space-y-5">
          {result.metrics.map((m, i) => (
            <MetricBar
              key={m.label}
              label={m.label}
              value={m.value}
              color={m.color}
              delay={i * 0.22}
              reduce={reduce}
            />
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="rounded-2xl border border-brand-cyan/40 bg-gradient-to-br from-brand-blue/6 to-brand-purple/6 p-7 text-center dark:border-brand-pink/35 dark:from-brand-purple/8 dark:to-brand-pink/6">
        <motion.p
          className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-cyan dark:text-brand-pink"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Seu plano começa hoje
        </motion.p>
        <motion.p
          className="mt-2 text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          Pronto para se tornar{" "}
          <span className="bg-gradient-to-r from-brand-blue to-brand-cyan bg-clip-text text-transparent dark:from-brand-purple dark:to-brand-pink" style={{ WebkitBackgroundClip: "text" }}>
            {result.profileName}
          </span>
          ?
        </motion.p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Comece os 30 dias grátis — sem cartão de crédito. Cancele quando quiser.
        </p>

        <motion.div
          className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <motion.div
            className="rounded-2xl"
            animate={reduce ? undefined : {
              boxShadow: [
                "0 0 18px rgba(0,188,212,0.25)",
                "0 0 40px rgba(0,188,212,0.55)",
                "0 0 18px rgba(0,188,212,0.25)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <QuizWaLink href={waQuizResult} className="px-8 py-4 text-base">
              Começar meu plano — 30 dias grátis
            </QuizWaLink>
          </motion.div>
        </motion.div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-5 text-xs text-[var(--text-muted)] underline underline-offset-2 transition-colors hover:text-[var(--text-primary)]"
        >
          Refazer o questionário
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function EvolutionQuiz() {
  const reduce = useReducedMotion();

  const [state, dispatch] = React.useReducer(quizReducer, {
    phase: "intro",
    currentStep: 0,
    answers: [],
    direction: 1,
  });

  const handleLoadingDone = React.useCallback(() => dispatch({ type: "LOADING_DONE" }), []);

  const getQuestion = React.useCallback((): { id: string; title: string; options: Option[] } | null => {
    const { currentStep, answers } = state;
    if (currentStep === 0) {
      return { id: "goal", title: "Qual é o seu principal objetivo agora?", options: GOAL_OPTIONS };
    }
    if (currentStep === 1) {
      const goal = (answers.find((a) => a.questionId === "goal")?.value ?? "productivity") as GoalKey;
      const titles: Record<GoalKey, string> = {
        intellectual: "O que você quer desenvolver?",
        financial:    "Qual é o seu foco financeiro?",
        career:       "O que você quer conquistar na carreira?",
        productivity: "Onde você sente mais dificuldade?",
        health:       "O que você quer melhorar primeiro?",
        entrepreneur: "Qual área do negócio quer focar?",
      };
      return { id: "context", title: titles[goal], options: Q2_BY_GOAL[goal] };
    }
    const q = STATIC_QUESTIONS[currentStep - 2];
    return q ?? null;
  }, [state]);

  const currentQuestion = state.phase === "quiz" ? getQuestion() : null;
  const currentAnswer   = currentQuestion ? state.answers.find((a) => a.questionId === currentQuestion.id)?.value : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <AnimatePresence mode="wait">
        {state.phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <IntroScreen onStart={() => dispatch({ type: "START" })} reduce={reduce} />
          </motion.div>
        )}

        {state.phase === "quiz" && currentQuestion && (
          <motion.div key={`step-${state.currentStep}`} className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <QuizStep
              questionId={currentQuestion.id}
              title={currentQuestion.title}
              options={currentQuestion.options}
              selected={currentAnswer}
              onSelect={(value) => dispatch({ type: "ANSWER", questionId: currentQuestion.id, value })}
              onBack={state.currentStep > 0 ? () => dispatch({ type: "BACK" }) : undefined}
              step={state.currentStep}
              total={TOTAL_STEPS}
              reduce={reduce}
              direction={state.direction}
            />
          </motion.div>
        )}

        {state.phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <LoadingScreen onDone={handleLoadingDone} reduce={reduce} />
          </motion.div>
        )}

        {state.phase === "result" && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
            <ResultScreen answers={state.answers} onRestart={() => dispatch({ type: "RESTART" })} reduce={reduce} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
