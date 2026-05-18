# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/) alinhado ao `version` em `package.json` (`0.1.0`).

## [Unreleased]

### Added

- Integração com API de **usuário responsável por tarefa** (`GET`/`PUT /auth/api/tasks/responsible`) nos modais de tarefa e subtarefa.
- Clients e UI para **subtarefas** (`GET`/`POST`/`DELETE /auth/api/tasks/subtask`).
- **Perfil de usuário** em Ajustes (`GET`/`PATCH /auth/api/user/profile`, `PATCH /auth/api/user/email`).
- Consulta de **plano Starter** (`GET /auth/api/user/starter-plan`) com ocultação de Finanças e Livros na navegação.
- Persistência de **notas JARVAR** (`GET`/`POST /auth/api/objectives/notes/{idObjective}`).
- **Pomodoro** global (timer, sidebar, página `/pomodoro`, áudio, wake lock).
- **Quiz Evolução** na página Sobre (`EvolutionQuiz`).
- **Compartilhamento de finanças** via link `/financas/compartilhado?token=…` (sessão em `sessionStorage`).
- **Google Analytics 4** com banner e preferências de **consentimento de cookies**.
- Página **`/privacidade`** (política / LGPD).
- Toasts globais (`AppToaster`), cópia de ID de tarefa (`TaskIdCopyRow`).
- Banner intro animado em **Livros** (`LivrosIntroBanner`).
- Variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` em `.env.example`.

### Changed

- Página de finanças refatorada para `FinancasPageContent`; delete de transação em `lib/finance/delete-finance-transaction.ts`.
- Modais de tarefa/subtarefa com suporte a responsável e subtarefas API.
- Upload e edição de sonhos (`SonhoFormModal`).
- Dependência **recharts** para gráficos.

### Documentation

- README de onboarding, variáveis de ambiente e índice de docs.
- `docs/tecnico-alteracoes-recentes.md` — documento técnico para integradores e QA.
- Atualização de `docs/TABELAS_ENDPOINTS.csv` e `docs/COMPONENTES.md`.
- Este `CHANGELOG.md`.

---

## Histórico por data (commits em `main`, últimos 15 ancestrais)

Referência para releases futuras (extraído de `git log`):

| Data (aprox.) | Commit / tema |
|---------------|----------------|
| 2026-05-18 | GA4 e consentimento de cookies (`de226c2`, `ecb3dd0`) |
| 2026-05-13 | Animação banner Livros (`b333d48`) |
| 2026-05-11 | Quiz Evolução (`9c04360`) |
| 2026-04-30 | Upload de imagem de sonho (`f2d4dc2`) |
| 2026-04-17 | Áudio / melhorias Pomodoro (`41ec495`, merges) |
| 2026-04-13 | Pomodoro (`c129185`, `9af81a4`) |
| 2026-04-12 | Correções iniciais WebV2 (`3671cdb`) |

---

## [0.1.0] - 2026-04-12

Versão inicial publicada em `package.json` — base Next.js 14 + PWA + integração com Gateway InEvolving.
