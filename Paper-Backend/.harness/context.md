# kami-backend — Contexto do Projeto

## Projeto

- Nome: kami-backend
- Organização: Origami Lab
- Repositório: https://github.com/Origami-Lab-Organization/kami-backend.git
- Estado: greenfield — implementação de referência criada em 2026-06-30.
- Objetivo: ser a implementação de referência do stack de back-end Node.js da
  Origami (ADR-021/023, harness-core) — mesmo papel que o kami-front-end tem
  pro front. O Harness aponta pra este repo; o código de exemplo mora aqui.

## Stack

- Linguagem: TypeScript strict (+ `noUncheckedIndexedAccess`);
  `moduleResolution: Bundler` — imports por alias, sem sufixo `.js`
  (`@/use-case`, `@/database`, `@/http`, `@/modules/*`, `@/*`; relativo só no
  mesmo diretório e dentro de `framework/`). Build tsup, dev tsx (ADR-026).
- HTTP: Fastify.
- Acesso a dados: Drizzle (Postgres).
- Validação: TypeBox nativo (sem AJV), só dentro do use case via
  `@ValidateWith`/`BaseValidator` (ADR-024).
- DI: tsyringe (`@injectable`/`@inject(Symbol)`); composition root em
  `config/bootstrap.ts` (ADR-024).
- Auth: cookie de sessão validado por middleware (front grava, back valida);
  JWT via `fast-jwt` (HS256).
- HTTP: routing declarativo (`registerRoutes([IRoute])`) — kit em
  `framework/http/`, composição em `server/http/` (ADR-024/025); `server/`
  acomoda `server/queue/` futuro.
- Logging: porta com injeção de dependência (`PinoLoggerAdapter` prod /
  `ConsoleLogAdapter` dev/test).
- Testes: Vitest — unitário com `vitest-mock-extended` (sem banco) +
  Testcontainers/Postgres real para `*.database.spec.ts` (ADR-011/ADR-022, db-testing-skill).
- Estrutura: kits autocontidos agrupados em `src/framework/` (`use-case/`,
  `database/`, `http/`) — copiam intactos entre projetos; conteúdo do app em
  `core/` (auth, logger, `core/database/` com schema/entities/`Db`). Não
  monorepo; cada kit é extraível pra `packages/` se algum projeto precisar
  (ADR-023/024/025).
- Resposta: envelope `{ process, body }` (ADR-023) — mesmo contrato que o
  http-client do kami-front-end já espera.

## Domínio

Não há domínio de negócio próprio — este repo é template/implementação de
referência. O módulo `modules/users/` existe só pra demonstrar o padrão
completo (use case + repository + rotas), não é feature real de produto.

## Governança

- Mudança de stack ou de estrutura (`database/`/`use-case/`) é decisão
  arquitetural — vira ADR aqui, não só código.
- Este repo é consumido por outros projetos via leitura sob demanda
  (ADR-018) — mudança de caminho de arquivo referenciado em
  `harness-core/.harness/patterns/backend.md` quebra o pointer; avisar.
