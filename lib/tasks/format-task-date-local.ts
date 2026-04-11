/**
 * Data local no formato `YYYY-MM-DD`.
 * Prefira isto a `toISOString().slice(0, 10)`, que usa UTC e pode mudar o dia no Brasil e em outros fusos.
 */
export function formatDateEnCA(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

/**
 * Valor seguro para `<input type="date">`: extrai `YYYY-MM-DD` do início da string (aceita ISO com hora/`Z`).
 * Não passa por `Date`, evitando deslocamento de um dia.
 */
export function toDateInputValue(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

/**
 * Dia de calendário **local** da tarefa, para comparar com `<input type="date">` ou `YYYY-MM-DD` do usuário.
 * - Só `YYYY-MM-DD` (sem hora): mantém o literal (evita `Date` em meia-noite UTC).
 * - ISO com hora/`Z`/offset: usa o instante no fuso do navegador (`formatDateEnCA`).
 * Assim evita o “um dia a menos” ao usar só o prefixo de strings `…T00:00:00.000Z`.
 */
export function taskDateToLocalCalendarYmd(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return toDateInputValue(s);
  return formatDateEnCA(d);
}

/**
 * `…T00:00:00.000Z` / `+00:00` — muitos backs gravam o “dia de negócio” como meia-noite UTC;
 * aí o prefixo `YYYY-MM-DD` já é o dia correto e o calendário local daria um dia a menos no BR.
 */
function isUtcMidnightIso(s: string): boolean {
  const t = s.trim();
  return /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?(?:Z|[+-]00:00)$/i.test(t);
}

/**
 * Normaliza `dateTask` vindo da API para `YYYY-MM-DD` alinhado ao que o usuário vê no quadro “Hoje”
 * (onde o GET por data ainda pode reforçar o dia pedido).
 *
 * - Só data `YYYY-MM-DD`: mantém.
 * - Meia-noite UTC explícita: usa a data UTC (prefixo), não o fuso local.
 * - Demais ISO (ex.: meia-noite BRT serializada como `…T03:00:00.000Z`): dia de calendário **local**.
 */
export function normalizeTaskDateField(raw: unknown): string {
  if (typeof raw !== "string") return formatDateEnCA(new Date());
  const s = raw.trim();
  if (!s) return formatDateEnCA(new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (isUtcMidnightIso(s)) {
    const v = toDateInputValue(s);
    if (v) return v;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    const v = toDateInputValue(s);
    return v || formatDateEnCA(new Date());
  }
  return formatDateEnCA(d);
}

/**
 * Interpreta `YYYY-MM-DD` como data de calendário **local** ao meio-dia
 * (evita o parse UTC de `new Date("YYYY-MM-DD")` e bordas de DST).
 */
export function parseLocalYmdAtNoon(ymd: string): Date {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(y, mo, day, 12, 0, 0, 0);
}

/** Próximo dia de calendário local a partir de `YYYY-MM-DD` (meio-dia local → +1 → `en-CA`). */
export function addOneLocalCalendarDay(ymd: string): string {
  const s = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = parseLocalYmdAtNoon(s);
  if (Number.isNaN(d.getTime())) return s;
  d.setDate(d.getDate() - 1);
  return formatDateEnCA(d);
}
