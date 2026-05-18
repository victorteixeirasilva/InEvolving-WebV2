# Biblioteca de componentes (front-end)

Visão rápida dos blocos principais do projeto **Next.js 14** (App Router). Estilos combinam **Tailwind**, **CSS variables** (`app/globals.css`, temas claro/escuro) e **styled-components** onde indicado.

> Documentação canônica em português. Espelho em inglês: [`COMPONENTS.md`](./COMPONENTS.md) (mesmo conteúdo).

## UI primitivos (`components/ui`)

| Componente | Função |
|------------|--------|
| `GlassCard` | Cartão com glassmorphism, hover lift opcional, motion (Framer). |
| `Button` | Botão com variantes `primary` \| `ghost` \| `outline`, ripple leve, `asChild` (Radix Slot). |
| `Input` | Campo com borda/glow no foco e altura mínima para toque (≥48px). |
| `Skeleton` | Placeholder com shimmer e painel translúcido. |
| `AnimatedLink` | Link com sublinhado animado (cyan / rosa no dark). |
| `DateField` | Campo de data acessível. |
| `AppToaster` | Toasts globais (Zustand `app-toast-store`). |

## Layout (`components/layout`)

| Peça | Função |
|------|--------|
| `AppShell` | Sidebar desktop, header mobile, área principal, bottom nav, drawer. |
| `AppSidebar` / `SidebarFooter` | Navegação lateral + Pomodoro embutido. |
| `BottomNav` | Atalhos principais + indicador Pomodoro ativo. |
| `MobileDrawer` | Drawer lateral (Radix Dialog) + `PomodoroSidebar`. |
| `AppHeader` | Logo e tema no mobile. |
| `nav-config.ts` | Itens de menu; `starterHidden` oculta Finanças/Livros no plano Starter; `#pomodoro` abre timer. |
| `CookieConsentBanner` | Banner LGPD; grava preferência antes de GA4. |
| `FinanceShareNavGuard` | Restringe navegação na sessão de finanças compartilhadas. |
| `ChunkLoadRecovery` | Recuperação de chunk após deploy (`NEXT_PUBLIC_APP_BUILD_TIME`). |
| `ThemeProvider` / `ThemeScript` | Tema claro/escuro sem flash. |

## Analytics (`components/analytics`)

| Peça | Função |
|------|--------|
| `AnalyticsWithConsent` | Monta GA4 só com consentimento. |
| `GoogleAnalyticsRouteTracker` | Page views em mudanças de rota. |

## Efeitos e fundo (`components/`)

| Peça | Função |
|------|--------|
| `AmbientBackground` | Gradiente animado, partículas, swirls SVG. |
| `ScrollReveal` / `ParallaxFloat` | Motion ao scroll. |
| `StaggerList` / `StaggerItem` | Entrada escalonada (Framer Motion). |
| `InstallPwaBanner` | Convite PWA (`beforeinstallprompt`). |

## Features — Tarefas (`components/features/tarefas`)

| Peça | Função |
|------|--------|
| `KanbanBoard` / `SubtarefasKanbanBoard` | Colunas de status; subtarefas via API `/tasks/subtask`. |
| `EditarTarefaModal` | CRUD tarefa; responsável (`enableResponsibleApi`); subtarefas. |
| `EditarSubtarefaModal` | Edição subtarefa + responsável opcional. |
| `TaskResponsibleLine` | Rótulo do responsável (criador / você / outro). |
| `TaskIdCopyRow` | Copiar UUID da tarefa para área de transferência. |

## Features — Finanças (`components/features/financas`)

| Peça | Função |
|------|--------|
| `FinancasPageContent` | Página principal (extraída de `app/(app)/financas/page.tsx`). |
| `FinancasTransactionsPanel` | Listagem e ações de transações. |
| `CompartilharFinancasModal` | Gera link `/financas/compartilhado?token=…`. |

## Features — Pomodoro (`components/features/pomodoro`)

| Peça | Função |
|------|--------|
| `PomodoroManager` | Provider global (registrado em `app/providers.tsx`). |
| `PomodoroSidebar` | Controles na sidebar/drawer (`#pomodoro`). |
| `PomodoroTimer` | Página `/pomodoro` — timer, fullscreen, wake lock, som. |

## Features — Sobre / Livros / Motivação / Dashboard

| Peça | Função |
|------|--------|
| `EvolutionQuiz` | Quiz interativo em `/sobre` (client-only). |
| `SobrePageContent` | Página sobre + quiz. |
| `LivrosIntroBanner` | Banner animado de onboarding em `/livros`. |
| `SonhoFormModal` | CRUD sonhos com upload de imagem. |
| `CompartilharCategoriaModal` / `EditarCategoriaModal` | Compartilhamento de categorias. |

## Features — Ajustes (`components/features/ajustes`)

| Peça | Função |
|------|--------|
| `AjustesClient` | Perfil via API (`GET/PATCH profile`, `PATCH email`). |
| `CookiePreferencesSection` | Reabrir preferências de cookies. |

## Dados e API

- **Produção:** `fetch` direto para `{NEXT_PUBLIC_API_URL}` — clients em `lib/` (tarefas, user, finance, books, motivation, objectives).
- **Inventário de endpoints:** [`TABELAS_ENDPOINTS.csv`](./TABELAS_ENDPOINTS.csv).
- **Alterações recentes:** [`tecnico-alteracoes-recentes.md`](./tecnico-alteracoes-recentes.md).

## PWA

- **Manifest:** `public/manifest.json`
- **Offline:** rota `/offline` e Workbox em `next.config.mjs`

## Stores (Zustand)

| Store | Uso |
|-------|-----|
| `pomodoro-store` | Sessões Pomodoro, timer ativo. |
| `cookie-consent-store` | Consentimento analytics. |
| `app-toast-store` | Fila de toasts. |
