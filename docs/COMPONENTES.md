# Biblioteca de componentes (front-end)

Visão rápida dos blocos principais do projeto Next.js (App Router). Estilos combinam **Tailwind**, **CSS variables** (`globals.css`, temas claro/escuro) e **styled-components** onde indicado.

## UI primitivos (`src/ui`)

| Componente | Função |
|------------|--------|
| `GlassCard` | Cartão com glassmorphism, hover lift opcional, motion (Framer). |
| `Button` | Botão com variantes `primary` \| `ghost` \| `outline`, ripple leve, `asChild` (Radix Slot). |
| `Input` | Campo com borda/glow no foco e altura mínima para toque (≥48px). |
| `Skeleton` | Placeholder com shimmer e painel translúcido. |
| `AnimatedLink` | Link com sublinhado animado (cyan / rosa no dark). |

## Layout (`src/layout`)

| Peça | Função |
|------|--------|
| `AppShell` | Composição: sidebar desktop, header mobile, área principal, bottom nav, drawer. |
| `Sidebar` / `SidebarFooter` | Navegação lateral + alternância de tema. |
| `BottomNav` | Quatro atalhos + “Menu” abre o drawer. |
| `MobileDrawer` | Drawer lateral (Radix Dialog + overlay com blur). |
| `AppHeader` | Logo central e tema no mobile. |
| `StyledComponentsRegistry` | SSR correto para styled-components. |
| `ThemeProvider` | Sincroniza classe `dark` e store Zustand com `localStorage.tema`. |
| `ThemeScript` | Evita flash de tema antes da hidratação. |

## Efeitos e fundo (`src/components`)

| Peça | Função |
|------|--------|
| `AmbientBackground` | Gradiente animado, radial, `LiquidSwirls` (SVG), `ParticleField` (canvas). |
| `LiquidSwirls` | Formas fluidas com blur SVG. |
| `ParticleField` | Partículas ciano em movimento lento. |
| `ScrollReveal` | Fade + slide ao entrar na viewport. |
| `ParallaxFloat` | Parallax leve ligado ao scroll. |
| `StaggerList` / `StaggerItem` | Lista com entrada escalonada (Framer Motion). |
| `InstallPwaBanner` | Convite de instalação (`beforeinstallprompt`). |

## Features (`src/features`)

| Peça | Função |
|------|--------|
| `GradientTitle` | Título com gradiente animado (styled-components). |
| `HeroSpringBadge` | Badge do hero com entrada fluida (@react-spring/web). |
| `ProfileMockDialog` | Modal Radix + overlay motion (perfil mock em Ajustes). |

## Dados e API

- **Mocks:** `GET /api/mock/*` (Route Handlers) alimentam SWR nas páginas.
- **Fase 2:** trocar fetchers para `apiClient` (`src/lib/api/client.ts`) e URLs em `src/lib/constants.ts`.

## PWA

- **Manifest:** `public/manifest.json`
- **Ícones:** `npm run icons` (gera `public/icons/icon-192x192.png` e `icon-512x512.png`)
- **Offline:** rota `/offline` e `navigateFallback` no Workbox (`next.config.mjs`)
