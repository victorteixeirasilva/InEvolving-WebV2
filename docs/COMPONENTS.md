# Catálogo de componentes (UI & layout)

Este documento resume os blocos reutilizáveis criados para o front-end InEvolving. Todos seguem o tema **liquid glass** (Tailwind + variáveis CSS) e animações com **Framer Motion** / **React Spring** onde indicado.

## UI (`/components/ui`)

| Componente | Responsabilidade |
|-------------|------------------|
| `GlassCard` | Card com `glass-card`, hover lift e sombra/glow (Framer Motion). |
| `Button` | Botão com variantes `primary` \| `ghost` \| `outline`, ripple no clique, `tap-target` ≥ 48px. |
| `PrimaryLink` | Link estilizado como botão (evita `<a><button></a>`); uso em CTAs estáticos. |
| `Input` | Campo com borda/glass e foco com glow (`brand-cyan`). |
| `Skeleton` | Placeholder com shimmer e fundo glass. |
| `AnimatedLink` | Link com sublinhado animado em cyan. |
| `GlowingTitle` | Título com gradiente animado (**styled-components**). |
| `SpringPulse` | Ponto pulsante (**@react-spring/web**), respeitar `prefers-reduced-motion` no uso. |

## Layout (`/components/layout`)

| Componente | Responsabilidade |
|-------------|------------------|
| `AppShell` | Sidebar (desktop), área principal, bottom nav + drawer (mobile), fundo líquido e partículas. |
| `AppSidebar` | Navegação lateral ≥ `lg`. |
| `BottomNav` | Barra inferior mobile; item “Menu” abre o drawer. |
| `MobileDrawer` | Drawer lateral (**Radix Dialog**) com todos os itens de `nav-config`. |
| `LiquidBackdrop` | SVG + gradiente animado (swirls). |
| `ParticleField` | Canvas com partículas; desliga com `prefers-reduced-motion`. |
| `ScrollReveal` | `FadeInView` e `ParallaxSection` para scroll / parallax leve. |
| `PwaInstallPrompt` | Captura `beforeinstallprompt` e oferece instalação. |

## Features (`/features`)

| Componente | Responsabilidade |
|-------------|------------------|
| `StaggerList` | Lista com fade-in + slide-up e **stagger** nos filhos. |

## Estilos

- **Globais:** `app/globals.css` — tokens `--glass-*`, `--text-*`, tema claro/escuro via `html.dark` e `data-theme`.
- **CSS Module exemplo:** `styles/auth-card.module.css` — borda gradiente animada no login/cadastro.

## Dados mock & API

- Tipos: `lib/types/models.ts` (alinhados a `docs/REQUISITOS_UX_UI.md`).
- Mock em memória: `lib/mock-data.ts`.
- JSON estático de referência: `public/data/dashboard.json`.
- Rota mock: `GET /api/mock/dashboard` (substituir por chamadas `axios` + `API_BASE_URL` na fase 2).

## Estado

- **Tema:** `stores/theme-store.ts` (Zustand + persist); sincroniza chave legada `tema` (`1` escuro, `2` claro).
- **Menu:** `stores/menu-store.ts` — drawer aberto/fechado e `tipoMenuDesk`.

Para detalhes de rotas e endpoints, ver `REQUISITOS_UX_UI.md` e `TABELAS_ENDPOINTS.csv`.
