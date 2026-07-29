# ADR-0008 — Geração de OpenAPI via `@Documentation` + `@fastify/swagger` (revê o adiamento do ADR-024)

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro
**Revê:** ADR-024 do harness-core, item 4 ("@Documentation fica como metadata — sem geração de OpenAPI ainda") — ver harness-core ADR-034

> ✅ **Aplicado em 2026-07-24.** O `@Documentation` deixa de ser metadado morto e
> passa a gerar OpenAPI de ponta a ponta, para virar o padrão que projetos
> baseados no kami copiam. Suíte verde (48 unit + 9 db), typecheck e lint limpos.

## Contexto

O ADR-024 adotou o decorator `@Documentation` mas adiou a geração de OpenAPI
("reavaliar quando houver mais módulos"). Resultado: o decorator existia mas
ninguém consumia — quem usasse o kami de base não sabia como/por que usá-lo. O
objetivo agora é fechar o ciclo, seguindo o padrão do integrator-api/tecnoflow
(`@fastify/swagger` + `@scalar/fastify-api-reference`).

## Decisão

1. **Dependências:** `@fastify/swagger` (gera o OpenAPI a partir do `schema` de
   cada rota) + `@scalar/fastify-api-reference` (UI em `/reference`). Mesmo
   stack do integrator-api.
2. **Divisão do `@Documentation`:** o **use case** declara `tags`, `summary`,
   `description`, `response`, `is_public`; o **validator** declara `request` (o
   schema que valida a entrada do cliente). O `UseCaseFactory` mescla: `request`
   vem do `@Documentation` do validator. Endpoint sem input de cliente (ex.:
   `/users/me`, `userId` da sessão) — validator sem `@Documentation.request` →
   nada é documentado como parâmetro.
3. **`registerRoutes` monta o `schema` da rota** (kit http) a partir da doc:
   `request` → `body` (POST/PUT/PATCH) ou `querystring` (GET/DELETE); `response`
   embrulhado no envelope `{ process, body }` (2xx) + envelope de erro (4xx);
   `auth_method` → `security: [{ cookieAuth: [] }]`. O schema é **só para
   documentação**: o app desliga `validatorCompiler` **e** `serializerCompiler`
   (validação e serialização seguem no use case — ADR-021).
4. **Schemas nomeados viram componentes.** `createSchema(schema, '$id')` nomeia;
   `app.addSchema(...)` registra; o `refResolver` do swagger usa o `$id` como
   nome do componente (senão gera `def-N`). `Type.Ref('$id')` no `response`
   resolve para `#/components/schemas/$id`.
5. **Helpers de resposta reutilizáveis** no kit use-case: `PaginationSchema`
   (componente nomeado `objects.Pagination`) + `paginated(item)` (`{ data:
   item[], pagination }`). Todo list endpoint reusa — sem duplicar o shape.
6. **Endpoints:** `/openapi.json` serve o documento; `/reference` a UI Scalar;
   `/health` e `/openapi.json` ficam `hide: true` (fora do doc).

## Consequências Positivas

- OpenAPI real gerado do `@Documentation` — o decorator vira padrão consumível;
  projetos baseados no kami copiam o fluxo.
- Componentes nomeados por `$id` (`entities.User`, `objects.Pagination`) com
  `$ref` — dedupe no doc.
- Schema doc-only não interfere no runtime (validação/serialização nos use cases).

## Consequências Negativas / Trade-offs

- Duas dependências novas (`@fastify/swagger`, `@scalar/fastify-api-reference`).
- Convenção a lembrar: **`request` mora no `@Documentation` do validator**, não
  do use case (o resto mora no use case).
- Schema de rota é só documentação — quem mexer precisa saber que não valida nem
  serializa (os compilers do Fastify estão desligados de propósito).

## Critério de Revisão

Rever se o time trocar o gerador (ex.: mover para OpenAPI a partir de um registry
central em vez de `addSchema` por schema) ou se precisar versionar o doc.

## Referências

- harness-core ADR-024 (item 4 revisto), ADR-034 (revisão org-wide).
- kami: `src/framework/http/routes.ts` (`buildRouteSchema`),
  `src/server/http/app.ts` (swagger/scalar/addSchema/refResolver),
  `src/framework/use-case/shared/schemas/pagination.schema.ts` (`paginated`),
  `src/modules/users/app/*.use-case.ts` (`@Documentation`).
- Inspiração: integrator-api `apps/api/src/servers/http/app.ts` + `utils/{routes,schema}.ts`.
