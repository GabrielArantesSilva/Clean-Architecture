# kami-backend

Implementação de referência do back-end Node.js da Origami Lab (ADR-021,
harness-core). Mesmo papel que o `kami-front-end` tem pro front: o código mora
aqui, o Harness só aponta (`patterns/backend.md`).

## Stack

Fastify · Drizzle (Postgres) · TypeBox nativo, sem AJV (validação só no use
case, via `@ValidateWith`) · tsyringe (DI por Symbol, composition root em
`config/bootstrap.ts`) · routing declarativo (rotas são dados) · cookie de
sessão validado por middleware (fast-jwt) · `env.ts` falha cedo no boot ·
logging por porta com injeção de dependência (Pino em prod, Console em
dev/test) · imports por alias, sem `.js` (`@/use-case`, `@/database`, `@/http`,
`@/modules/*`, `@/*`) · build via tsup, dev via tsx. Ver ADR-021/023/024/025/026.

## Estrutura

```
src/
  framework/    os módulos-guia — copiam INTACTOS entre projetos (ADR-025):
    use-case/     contrato IUseCase<T, K>, UseCaseHandler/Factory, BaseValidator
                  (TypeBox), @ValidateWith/@Documentation, HttpException e o
                  envelope { process, body } (patterns/frontend.md).
    database/     factory Drizzle paramétrica, contexto de transação,
                  DrizzleBaseRepository<TDb>, paginação.
    http/         registerRoutes (rotas como dados) + applyUseCase (request →
                  use case → envelope).
  core/         fundação DESTE app (reescreve por projeto): auth (porta +
                adapter fast-jwt + middleware), logger (porta + adapters),
                database/ (schema Drizzle, entities, alias Db).
  server/       transportes: index.ts (entrypoint) + http/ (app Fastify,
                error handler). server/queue/ entra aqui no futuro.
  modules/      um bounded context por pasta (ex.: users) — use cases,
                repository (interface + Symbol) e rotas do contexto.
  config/       bootstrap.ts — composition root de DI.
  testing/      primitivo de banco efêmero (Testcontainers) + support de specs.
```

Nem monorepo, nem pacotes separados — serve projeto único como está; num
monorepo, cada kit de `framework/` vira um `packages/<kit>` literal sem
reescrever import (ADR-023/025). Cada pasta-guia tem README próprio.

## Contrato de resposta — `{ process, body }`

Toda resposta sai nesse envelope: sucesso → `{ process: "success", body: <dados> }`;
falha → `{ process: "failed", body: "<mensagem>" }`. Use cases lançam uma
subclasse de `HttpException` (barrel `framework/use-case`); o error handler
central (`server/http/error-handler.ts`) traduz pra HTTP sem mais nada.

## Rodando

```bash
cp .env.example .env   # ajuste DATABASE_URL/SESSION_SECRET
pnpm install
pnpm dev               # Fastify com watch
```

## Testes

```bash
pnpm test:unit   # rápido, sem Docker
pnpm test:db     # Testcontainers — *.database.spec.ts (precisa Docker)
pnpm test        # os dois
```

`pnpm db:test:up` sobe um Postgres efêmero isolado pra inspecionar na mão.
