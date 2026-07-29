# Boundaries — kami-backend

## Secrets

- Nunca versionar `.env` real, segredo de sessão ou credencial de banco real.
- `.env.example` só com nomes de variável e placeholders inertes.
- `dados.sql` (massa de teste) nunca carrega segredo/credencial real — só dado sintético.

## Estrutura

- Nada dentro de `src/framework/` importa nada de fora do framework (além de
  libs) — é o que garante que os kits copiem intactos entre projetos e sejam
  extraíveis pra `packages/` (ADR-023/025). Import cruzado entre kits só por
  caminho relativo dentro do framework.
- Schema Drizzle, entities e o alias `Db` moram em `core/database/` — nunca
  dentro de `framework/database/` (o kit é paramétrico; ADR-025).
- A interface do repository (`I<X>Repository`) + o Symbol de DI moram no módulo
  do bounded context, nunca dentro dos kits — o framework só tem o genérico.

## Resposta HTTP

- Toda resposta sai no envelope `{ process, body }` — nunca um shape
  diferente "só essa vez". Use case que precisa recusar request lança uma
  `HttpException` (importada do barrel `framework/use-case/index.ts`; implementada
  em `framework/use-case/shared/utils/exceptions.ts` — ADR-024/025); nunca
  formata erro na mão na rota.

## Testes

- Nunca mocke o banco em `*.database.ts` — Postgres real via Testcontainers
  (ADR-011/ADR-022, db-testing-skill).
