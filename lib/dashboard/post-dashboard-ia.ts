import { API_BASE_URL } from "@/lib/constants";
import type { JarvarAnalysis, Objective } from "@/lib/types/models";

const DASHBOARD_IA_PATH = "/auth/api/dashboard/ia";

export type PostDashboardIaResult =
  | { kind: "ok"; responseText: string }
  | { kind: "unauthorized" }
  | { kind: "network_error" }
  | { kind: "http_error"; status: number };

function taskPercent(value: number | undefined, total: number): number | undefined {
  if (total <= 0) return undefined;
  return Math.round(((value ?? 0) / total) * 100);
}

const IA_LOCALE_INSTRUCTION =
  "Instrução fixa para o assistente: responda sempre em português do Brasil (pt-BR) — títulos, parágrafos, listas e exemplos — com linguagem natural e clara. Não mude para outro idioma salvo citações que devam permanecer no original.";

function buildDescriptionObjectiveForIa(
  originalDescription: string | undefined,
  options: {
    userContext: string;
    selectedHistory: JarvarAnalysis | null;
    history: JarvarAnalysis[];
  }
): string {
  const lines: string[] = [];

  lines.push(IA_LOCALE_INSTRUCTION);
  lines.push("");
  lines.push("--- Descrição cadastrada do objetivo ---");
  lines.push((originalDescription ?? "").trim() || "(sem descrição cadastrada no sistema)");

  lines.push("");
  lines.push("--- Contexto adicional (sessão atual) ---");
  lines.push(
    "O texto a seguir foi digitado pelo usuário nesta sessão para contextualizar a análise (observações, circunstâncias, sentimentos). Não é dado estruturado persistido pelo sistema de tarefas; trate como contexto subjetivo opcional."
  );
  lines.push(options.userContext.trim() || "(nenhum texto adicional nesta sessão)");

  lines.push("");
  lines.push("--- Histórico de análises anteriores (mesmo objetivo) ---");
  lines.push(
    "Abaixo: histórico de análises já geradas para este objetivo. A seção 'Análise referenciada' contém a resposta completa da IA que o usuário selecionou na interface para dar continuidade (ou indicação de que não há seleção). Em seguida, cada entrada do histórico recente traz a data, o texto livre que o usuário enviou naquela ocasião ('contexto na ocasião') e a resposta que o assistente deu ('resposta do assistente'). Use isso para manter coerência e evitar repetir o que já foi dito, salvo se fizer sentido."
  );

  if (options.selectedHistory?.response?.trim()) {
    lines.push("");
    lines.push("Análise referenciada pelo usuário na interface (continuidade):");
    lines.push(options.selectedHistory.response.trim());
  } else {
    lines.push("");
    lines.push("Análise referenciada pelo usuário na interface: (nenhuma seleção — ignore continuidade explícita).");
  }

  lines.push("");
  lines.push("Interações recentes já armazenadas (mais novas primeiro, como na interface):");
  if (options.history.length === 0) {
    lines.push("(nenhum histórico anterior armazenado)");
  } else {
    for (const h of options.history) {
      lines.push("");
      lines.push(`• Data/hora: ${h.createdAt}`);
      lines.push(`  Contexto na ocasião (texto livre do usuário): ${h.userContext.trim() || "(vazio)"}`);
      lines.push(`  Resposta do assistente: ${h.response.trim() || "(vazio)"}`);
    }
  }

  return lines.join("\n");
}

/**
 * Monta o corpo do POST com os campos do objetivo; contexto da sessão, histórico e
 * instruções para a IA ficam concatenados em `descriptionObjective`.
 */
export function buildDashboardIaRequestBody(
  objective: Objective,
  options: {
    userContext: string;
    selectedHistory: JarvarAnalysis | null;
    history: JarvarAnalysis[];
  }
): Record<string, unknown> {
  const o = objective;
  const total = o.totNumberTasks ?? 0;

  const base: Record<string, unknown> = {
    id: o.id,
    nameObjective: o.nameObjective,
    descriptionObjective: buildDescriptionObjectiveForIa(o.descriptionObjective, options),
    statusObjective: o.statusObjective,
    completionDate: o.completionDate,
    idUser: o.idUser,
    totNumberTasks: o.totNumberTasks,
    numberTasksToDo: o.numberTasksToDo,
    numberTasksDone: o.numberTasksDone,
    numberTasksInProgress: o.numberTasksInProgress,
    numberTasksOverdue: o.numberTasksOverdue,
    numberTasksCancelled: o.numberTasksCancelled,
  };

  if (total > 0) {
    base.percentageTasksToDo = taskPercent(o.numberTasksToDo, total);
    base.percentageTasksDone = taskPercent(o.numberTasksDone, total);
    base.percentageTasksInProgress = taskPercent(o.numberTasksInProgress, total);
    base.percentageTasksOverdue = taskPercent(o.numberTasksOverdue, total);
    base.percentageTasksCancelled = taskPercent(o.numberTasksCancelled, total);
  }

  return base;
}

/** Formato OpenAI-compatible: `choices[0].message.content`. */
function extractChatCompletionContent(root: Record<string, unknown>): string | null {
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (first === null || typeof first !== "object") return null;
  const message = (first as Record<string, unknown>).message;
  if (message === null || typeof message !== "object") return null;
  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string" || !content.trim()) return null;
  return content.trim();
}

function parseIaResponseBody(body: unknown): string | null {
  if (body === null) return null;

  // Corpo inteiro como string (JSON serializado uma vez ou texto puro).
  if (typeof body === "string") {
    const s = body.trim();
    if (!s) return null;
    try {
      return parseIaResponseBody(JSON.parse(s) as unknown);
    } catch {
      return s;
    }
  }

  if (typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  const fromChat = extractChatCompletionContent(o);
  if (fromChat) return fromChat;

  const direct =
    typeof o.response === "string"
      ? o.response
      : typeof o.analysis === "string"
        ? o.analysis
        : typeof o.message === "string"
          ? o.message
          : typeof o.text === "string"
            ? o.text
            : typeof o.content === "string"
              ? o.content
              : null;
  if (direct && direct.trim()) return direct.trim();

  const data = o.data;
  if (data !== null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const fromChatData = extractChatCompletionContent(d);
    if (fromChatData) return fromChatData;
    const inner =
      typeof d.response === "string"
        ? d.response
        : typeof d.analysis === "string"
          ? d.analysis
          : typeof d.text === "string"
            ? d.text
            : null;
    if (inner && inner.trim()) return inner.trim();
  }

  return null;
}

/**
 * POST `{API_BASE_URL}/auth/api/dashboard/ia` — análise de IA do objetivo.
 */
export async function postDashboardIa(
  jwtToken: string,
  body: Record<string, unknown>
): Promise<PostDashboardIaResult> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${DASHBOARD_IA_PATH}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(body),
    });

    const rawText = await res.text();
    let data: unknown = null;
    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText) as unknown;
      } catch {
        // Corpo não é JSON no topo (ex.: markdown puro) — `parseIaResponseBody` ainda trata string.
        data = rawText;
      }
    }

    if (res.status === 401) {
      return { kind: "unauthorized" };
    }

    // TODO (contract): 403 — plano sem IA ou cota esgotada.
    // TODO (contract): 404 — objetivo inexistente.
    if (res.status === 403 || res.status === 404) {
      return { kind: "http_error", status: res.status };
    }

    if (res.ok) {
      // TODO (contract): 202 + job id para resultado assíncrono.
      // TODO (contract): 204 — improvável; definir comportamento.
      const responseText = parseIaResponseBody(data);
      if (responseText === null) {
        // TODO (contract): corpo vazio ou formato inesperado — mensagem ao usuário e log.
        return { kind: "http_error", status: res.status };
      }
      return { kind: "ok", responseText };
    }

    // TODO (contract): 400 / 422 — validação de payload; mensagens por campo.
    // TODO (contract): 429 — rate limit / cota de tokens.
    // TODO (contract): 503 — modelo indisponível.
    if (res.status >= 500) {
      // TODO (contract): 502 Bad Gateway.
      return { kind: "http_error", status: res.status };
    }

    // TODO (contract): outros 4xx e corpo de erro (`error`, `errors`).
    return { kind: "http_error", status: res.status };
  } catch {
    // TODO (contract): timeout, rede, CORS.
    return { kind: "network_error" };
  }
}
