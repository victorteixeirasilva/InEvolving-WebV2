/**
 * Monta o link “Criar evento” do Google Agenda (`/calendar/r/eventedit`).
 * @see https://calendar.google.com/calendar/r/eventedit?text=…&details=…&dates=…
 */
export function buildGoogleCalendarEventEditUrl(params: {
  /** Título do evento */
  text: string;
  /** Corpo / notas (opcional) */
  details?: string;
  /** Data da tarefa no formato YYYY-MM-DD */
  date: string;
}): string | null {
  const trimmed = params.date.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const ymd = `${m[1]}${m[2]}${m[3]}`;
  const dates = `${ymd}T000000/${ymd}T000000`;
  const base = "https://calendar.google.com/calendar/r/eventedit";
  const q = new URLSearchParams();
  const title = params.text.trim();
  if (!title) return null;
  q.set("text", title);
  q.set("details", (params.details ?? "").trim());
  q.set("dates", dates);
  return `${base}?${q.toString()}`;
}
