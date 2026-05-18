# Documentação técnica — alterações recentes (InEvolving-WebV2)

**Projeto:** InEvolving-WebV2 (frontend Next.js 14)  
**Versão do app:** `0.1.0` (`package.json`)  
**Intervalo analisado:** `git diff HEAD~15..HEAD` em `main` (aprox. 2026-04-12 a 2026-05-18)  
**Base da API:** `{NEXT_PUBLIC_API_URL}` (padrão: `https://api.inevolving.inovasoft.tech`)  
**Autenticação:** `Authorization: Bearer <JWT>` em rotas `/auth/api/*`

Este documento descreve o que mudou no front-end para consumo por **desenvolvedores de API/Gateway**, **outro front-end**, **QA** e **testes de integração**. Contratos HTTP foram extraídos dos clients em `lib/` — não inventar campos além do que consta no código.

**Documentação complementar (Gateway):**

- Usuário responsável por tarefa: `Gateway-Service/docs/tasks-responsible-user-gateway.md`

---

## Índice

1. [Resumo executivo](#resumo-executivo)
2. [Modelos de dados (front)](#modelos-de-dados-front)
3. [API — usuário responsável por tarefa](#api--usuário-responsável-por-tarefa)
4. [API — subtarefas](#api--subtarefas)
5. [API — perfil e plano Starter](#api--perfil-e-plano-starter)
6. [API — notas do objetivo (JARVAR)](#api--notas-do-objetivo-jarvar)
7. [API — finanças (refactor)](#api--finanças-refactor)
8. [Funcionalidades sem API](#funcionalidades-sem-api)
9. [Variáveis de ambiente](#variáveis-de-ambiente)
10. [Impacto para QA](#impacto-para-qa)
11. [Impacto para backend](#impacto-para-backend)
12. [Checklist de validação](#checklist-de-validação)

---

## Resumo executivo

| Área | Tipo | Destaque |
|------|------|----------|
| Tarefas | API + UI | GET/PUT responsável; CRUD subtarefas via `/auth/api/tasks/subtask` |
| Ajustes | API + UI | Perfil GET/PATCH, e-mail PATCH, plano Starter GET |
| Objetivo / JARVAR | API | Persistência de notas de IA em `/auth/api/objectives/notes` |
| Finanças | UI + refactor | Compartilhamento por link com JWT na query; `FinancasPageContent` |
| Pomodoro | Client-only | Timer global, wake lock, áudio |
| Analytics | Client + env | GA4 com consentimento de cookies (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) |
| Sobre | Client-only | Quiz de evolução (`EvolutionQuiz`) |
| Livros | UI | Banner intro animado (`LivrosIntroBanner`) |
| Legal | Estático | Página `/privacidade` |
| UX global | Client | Toasts (`AppToaster`), cópia de ID de tarefa |

---

## Modelos de dados (front)

Arquivo: `lib/types/models.ts`

### `Tarefa` / `TarefaSubtarefa`

- **`idResponsibleUser`**: `string | null` — valor bruto do GET responsible; `null` = sem atribuição explícita (UI faz fallback para `idUser` / criador).
- **`idParentTask`**, **`hasSubtasks`**, **`subtasks`**: suporte a subtarefas na API.
- **`sharedTask`**: tarefa colaborativa local; **desliga** a API de responsável na edição (`enableResponsibleApi={!task.sharedTask}`).

### `Note` (notas JARVAR)

```ts
{
  id: string;
  idUser: string;
  idObjective: string;
  content: string;      // Markdown
  createdAt: string;  // ISO 8601 (servidor UTC-3)
}
```

### `UserProfileResponse` (espelho do GET profile)

`email`, `emailVerified`, `lastLogin`, `isActive`, `fullName`, `profilePictureUrl`, `cpf`, `dateOfBirth`, `billingAddress`, `phoneNumber`, `dataDaProximaRenovacao`.

---

## API — Usuário responsável por tarefa

**Clients:** `lib/tasks/fetch-task-responsible.ts`, `lib/tasks/put-task-responsible.ts`, `lib/tasks/task-responsible.ts`  
**UI:** `EditarTarefaModal`, `EditarSubtarefaModal`, `TaskResponsibleLine`, `TaskIdCopyRow`

### GET `/auth/api/tasks/responsible/{idTask}`

| Item | Valor |
|------|--------|
| Headers | `Authorization: Bearer`, `Accept: application/json` |
| Resposta 200 | `{ "idTask": "uuid", "idResponsibleUser": "uuid" \| null }` |
| `idResponsibleUser` null | Sem responsável explícito (criador efetivo na UI) |

**Retornos no client (`FetchTaskResponsibleResult`):**

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx + body parseável |
| `unauthorized` | HTTP 401 |
| `http_error` | Outros HTTP ou body inválido em 2xx |
| `network_error` | Falha de rede |

### PUT `/auth/api/tasks/responsible`

| Item | Valor |
|------|--------|
| Body | `{ "idTask": "uuid", "idResponsibleUser": "uuid" \| null }` |
| `idResponsibleUser: null` | Remove atribuição |
| Resposta 200 | Mesmo shape do GET |

**Retornos no client (`PutTaskResponsibleResult`):** `ok`, `unauthorized`, `http_error`, `network_error`.

### Regras de UI

- API de responsável só para tarefas/subtarefas com **UUID** (`isApiTaskUuid`).
- Prop `enableResponsibleApi`: `true` em edição de tarefa própria; `false` se `sharedTask`.
- Escolhas na UI: `"creator"` (envia `null`) ou `"self"` (envia `viewerUserId` do JWT).
- O front **não envia** `idUser` no body — o Gateway extrai do JWT.

---

## API — Subtarefas

**Base path:** `/auth/api/tasks/subtask`  
**Clients:** `fetch-subtasks.ts`, `post-subtask.ts`, `delete-subtask.ts`  
**Normalização:** `normalizeApiSubtask()` em `lib/subtarefas.ts`

### GET `/auth/api/tasks/subtask/{idParentTask}`

- Lista subtarefas da tarefa pai.
- Resposta: **array JSON** de objetos com pelo menos `id`, `nameTask`, `descriptionTask`, `dateTask`, `status`, `idObjective`, opcionalmente `idParentTask`, `idUser`, `cancellationReason`.

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx — array (vazio permitido) |
| `unauthorized` | 401 |
| `not_found` | 404 |
| `http_error` | 403, 5xx, outros |
| `network_error` | Exceção de rede |

### POST `/auth/api/tasks/subtask`

**Body:**

```json
{
  "nameTask": "string",
  "descriptionTask": "string",
  "dateTask": "YYYY-MM-DD",
  "idParentTask": "uuid"
}
```

`idUser` vem do JWT no Gateway (não enviar no body).

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx + `normalizeApiSubtask` válido |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `invalid_response` | 2xx com body não normalizável |
| `http_error` | Demais HTTP |
| `network_error` | Rede |

### DELETE `/auth/api/tasks/subtask/{idTask}`

- `idTask` = UUID da **subtarefa** (não do pai).
- Backend atualiza `hasSubtasks` do pai automaticamente (comentário no client).

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `http_error` | Outros |
| `network_error` | Rede |

---

## API — Perfil e plano Starter

### GET `/auth/api/user/profile`

**Client:** `lib/user/fetch-user-profile.ts`

| `kind` | Condição |
|--------|----------|
| `ok` | 200 + `parseUserProfileResponse` |
| `unauthorized` | 401 |
| `invalid_body` | 200 com body inválido |
| `http_error` | 403, 404, 5xx |
| `network_error` | Rede |

### PATCH `/auth/api/user/profile`

**Body (`PatchUserProfileBody`):** `fullName`, opcional `profilePictureUrl`, `cpf`, `dateOfBirth`, `billingAddress`, `phoneNumber` — **sem e-mail**.

| `kind` | Condição |
|--------|----------|
| `ok` | 200 |
| `validation_error` | 400 |
| `unauthorized` | 401 |
| `http_error` | 403, 404, 5xx |
| `network_error` | Rede |

### PATCH `/auth/api/user/email`

**Body:** `{ "email": "string" }` (trim no client).

| `kind` | Condição |
|--------|----------|
| `ok` | 200 — troca solicitada; confirmação por link |
| `same_email` | 200 — mensagem indica que o e-mail não mudou |
| `email_in_use` | 401 com corpo de exceção (heurística no client) |
| `validation_error` | 400 |
| `unauthorized` | 401 |
| `http_error` | 403, 404, 5xx |
| `network_error` | Rede |

### GET `/auth/api/user/starter-plan`

**Resposta esperada:** `{ "isStarterPlan": boolean }`  
**Client:** `lib/auth/fetch-starter-plan.ts` — após login, flag em `localStorage` (`use-starter-plan`).

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx |
| `unauthorized` | 401 |
| `error` | Outros HTTP ou rede |

**Efeito na UI:** itens com `starterHidden: true` em `nav-config.ts` ocultam **Finanças** e **Livros** para plano Starter.

---

## API — Notas do objetivo (JARVAR)

**Path:** `/auth/api/objectives/notes/{idObjective}`

### GET

- 404 tratado como `not_found` (UI pode exibir lista vazia).
- 200: array de `Note`.

| `kind` | Condição |
|--------|----------|
| `ok` | 200 + array |
| `not_found` | 404 |
| `unauthorized` | 401 |
| `http_error` | Outros |
| `network_error` | Rede |

### POST

**Body:** `{ "content": "markdown..." }`  
**Esperado:** HTTP **201** com objeto `Note` (client aceita qualquer 2xx como `ok`).

| `kind` | Condição |
|--------|----------|
| `ok` | 2xx |
| `unauthorized` | 401 |
| `http_error` | Outros |
| `network_error` | Rede |

Fluxo: após `POST /auth/api/dashboard/ia`, o conteúdo Markdown retornado pode ser persistido via POST notes.

---

## API — Finanças (refactor)

- **DELETE** `/auth/api/finance/transaction/{id}` — extraído para `lib/finance/delete-finance-transaction.ts`.
- **Compartilhamento (sem endpoint dedicado):**
  - `CompartilharFinancasModal` gera URL: `/financas/compartilhado?token=<JWT>`.
  - `applyFinanceShareTokenFromUrl` grava JWT em `localStorage` e flag em `sessionStorage`.
  - `FinanceShareNavGuard` restringe navegação na sessão de compartilhamento.
  - Rota pública: `app/(public)/financas/compartilhado/page.tsx`.

---

## Funcionalidades sem API

### Pomodoro

| Item | Detalhe |
|------|---------|
| Rotas | `/pomodoro`, atalho `#pomodoro` na nav |
| Estado | `stores/pomodoro-store.ts` (Zustand) |
| Global | `PomodoroManager` em `app/providers.tsx` |
| Áudio | `lib/pomodoro-audio.ts` |
| Tela cheia / wake lock | `hooks/use-fullscreen-with-mobile-fallback.ts`, `use-pomodoro-focus-wake-lock.ts` |

### Quiz Evolução

- Componente: `components/features/sobre/EvolutionQuiz.tsx`
- Embutido em `/sobre` — lógica 100% client-side.

### Cookie consent + Google Analytics 4

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — carregado só após consentimento (`cookie-consent-store`, `AnalyticsWithConsent`, `GoogleAnalyticsRouteTracker`).
- Banner: `CookieConsentBanner`; preferências em Ajustes: `CookiePreferencesSection`.
- Página legal: `/privacidade`.

### Toasts globais

- `lib/app-toast.ts` + `stores/app-toast-store.ts` + `components/ui/AppToaster.tsx`.

### Livros — banner intro

- `LivrosIntroBanner.tsx` — animação de onboarding na listagem (sem API nova).

### Upload de imagem de sonho

- Alterações em `SonhoFormModal.tsx` (commit `f2d4dc2`, 2026-04-30) — continua usando APIs existentes de `lib/motivation/*`.

---

## Variáveis de ambiente

Ver `.env.example`. Novas ou relevantes no intervalo:

| Variável | Obrigatória | Uso |
|----------|-------------|-----|
| `NEXT_PUBLIC_API_URL` | Sim (dev) | Base do Gateway |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | Open Graph / URL canônica |
| `NEXT_PUBLIC_WHATSAPP_HELP_URL` | Opcional | Ajuda |
| `NEXT_PUBLIC_WHATSAPP_RENEWAL_URL` | Opcional | Modal plano expirado no login |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional | GA4 (só após consentimento) |
| `NEXT_PUBLIC_APP_VERSION` | Opcional | Build info |
| `NEXT_PUBLIC_APP_BUILD_TIME` | Opcional | Cache bust / chunk recovery |

---

## Impacto para QA

### Pré-condições

- JWT válido em `localStorage` (chave definida em `STORAGE_KEYS.token`).
- Tarefas/subtarefas de teste com **UUID** (não IDs numéricos de mock).

### Casos prioritários

| # | Cenário | Rota / ação | Resultado esperado |
|---|---------|-------------|-------------------|
| 1 | Consultar responsável | Editar tarefa UUID | GET responsible; label em `TaskResponsibleLine` |
| 2 | Atribuir a si | PUT `idResponsibleUser` = user do JWT | GET subsequente reflete UUID |
| 3 | Voltar ao criador | PUT `idResponsibleUser: null` | UI mostra criador |
| 4 | Tarefa compartilhada | `sharedTask` preenchido | Sem seletor de responsável |
| 5 | CRUD subtarefa | Kanban / modal | POST/GET/DELETE subtask |
| 6 | Perfil | `/ajustes` | GET profile; PATCH nome/CPF/etc. |
| 7 | E-mail | PATCH email | Mensagem de confirmação ou `same_email` |
| 8 | Starter | Login usuário Starter | Finanças e Livros ocultos na nav |
| 9 | Notas JARVAR | Objetivo + IA | POST note após análise |
| 10 | Finanças share | Gerar link → abrir em outro browser | `/financas/compartilhado?token=...` |
| 11 | Cookies | Primeira visita | Banner; GA só após aceitar |
| 12 | Pomodoro | `#pomodoro` / `/pomodoro` | Timer, som, wake lock (mobile) |
| 13 | Privacidade | `/privacidade` | Conteúdo estático |

### Regressão

- Endpoints legados de tarefas (`/auth/api/tasks/*`) inalterados pelo client de responsible (API **independente** do CRUD legado).

---

## Impacto para backend

1. **Responsible user:** contrato canônico no Gateway — ver `tasks-responsible-user-gateway.md`. Front alinhado a GET/PUT documentados.
2. **Subtarefas:** confirmar no Swagger Gateway campos exatos de resposta POST (front tolera subset via `normalizeApiSubtask`).
3. **Profile / email / starter-plan:** erros 400 devem retornar `message` string parseável (`read-user-api-response.ts`).
4. **Notes:** POST deve aceitar `{ content }` e retornar objeto compatível com `Note`.
5. O front **nunca** envia `idUser` em responsible/subtask — apenas JWT.

---

## Checklist de validação

- [ ] Documentação reflete endpoints usados nos clients `lib/` deste diff
- [ ] README lista variáveis de ambiente (incl. GA4)
- [ ] CHANGELOG segue Keep a Changelog e datas dos commits
- [ ] `TABELAS_ENDPOINTS.csv` inclui linhas novas
- [ ] Links para Gateway doc e arquivos `docs/` internos válidos
- [ ] Nenhuma funcionalidade documentada sem evidência no código ou no diff

---

*Gerado como parte da sincronização de documentação do InEvolving-WebV2 (2026-05-18).*
