# InEvolving-WebV2

Frontend **Next.js 14** (App Router) + **PWA** para a plataforma InEvolving. Consome a API via **Gateway** (`NEXT_PUBLIC_API_URL`), com autenticação JWT nas rotas `/auth/api/*`.

## Pré-requisitos

- **Node.js** 20 ou superior
- **npm** 10+

## Como rodar

```bash
# 1. Variáveis de ambiente
cp .env.example .env.local
# Edite .env.local conforme o ambiente

# 2. Dependências
npm install

# 3. Desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint (Next.js) |

## Variáveis de ambiente

Copie de [`.env.example`](./.env.example). Em produção, o projeto usa [`.env.production`](./.env.production) versionado.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | Sim | URL base do Gateway (ex.: `https://api.inevolving.inovasoft.tech`) |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | URL canônica para Open Graph |
| `NEXT_PUBLIC_WHATSAPP_HELP_URL` | Opcional | Link WhatsApp (ajuda) |
| `NEXT_PUBLIC_WHATSAPP_RENEWAL_URL` | Opcional | Link renovação de plano (login) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional | ID GA4 — carregado **após** consentimento de cookies |
| `NEXT_PUBLIC_APP_VERSION` | Opcional | Versão exibida no app |
| `NEXT_PUBLIC_APP_BUILD_TIME` | Opcional | Stamp de build (recuperação de chunks) |

> Não commite segredos em `.env.local`. O `.env.example` documenta apenas variáveis públicas (`NEXT_PUBLIC_*`).

## Estrutura do projeto

```
app/              Rotas (App Router): (app), (public)
components/       UI, layout, features
lib/              Clients HTTP, utilitários, tipos
stores/           Estado global (Zustand)
docs/             Documentação técnica e inventários
public/           Assets estáticos, manifest PWA
```

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [CHANGELOG.md](./CHANGELOG.md) | Histórico de versões (Keep a Changelog) |
| [docs/tecnico-alteracoes-recentes.md](./docs/tecnico-alteracoes-recentes.md) | Handoff técnico: APIs, DTOs, retornos, QA |
| [docs/TABELAS_ENDPOINTS.csv](./docs/TABELAS_ENDPOINTS.csv) | Mapeamento tela → endpoint |
| [docs/COMPONENTES.md](./docs/COMPONENTES.md) | Catálogo de componentes |
| [docs/REQUISITOS_UX_UI.md](./docs/REQUISITOS_UX_UI.md) | Requisitos de UX/UI |

### Contratos de API (backend)

Documentação de Gateway/microsserviços vive nos repositórios Back-End. Exemplo relevante para tarefas:

- **Usuário responsável:** `Gateway-Service/docs/tasks-responsible-user-gateway.md`

## Stack principal

- Next.js 14, React 18, TypeScript
- Tailwind CSS, styled-components, Framer Motion
- TanStack Query, Zustand, React Hook Form + Zod
- PWA (`@ducanh2912/next-pwa`)
- Recharts (gráficos em objetivos/dashboard)

## Licença

Projeto privado InEvolving / Inovasoft.
