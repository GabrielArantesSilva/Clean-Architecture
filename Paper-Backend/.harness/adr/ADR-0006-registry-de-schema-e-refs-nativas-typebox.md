# ADR-0006 — `Type.Ref`/`$id` nativos via `Compile(context, schema)` com referências explícitas por validator (revisa ADR-0005)

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro
**Revisa:** ADR-0005 (que dispensava registry/$id por acreditá-los "mecânica de AJV")

> ✅ **Aplicado em 2026-07-24.** Habilita `$id`/`Type.Ref` no back para (1)
> validators reusarem schemas nomeados e (2) o `@Documentation` referenciar
> schemas por `$id` (OpenAPI futuro). Suíte verde (43 unit + 9 db), typecheck e
> lint limpos. **Sem AJV** — é TypeBox nativo (mantém o ADR-024 do harness-core).

## Contexto

O ADR-0005 concluiu que refs/`$id`/registry eram "mecânica da era AJV" e que o
`Compile` nativo não resolveria refs — logo, reuso só por composição
(`Type.Pick`). Essa conclusão estava **errada por API incorreta**: eu chamava
`Compile(schema, [referencesArray])`, que de fato **não valida** (bypass
silencioso — o `Check` passa dado inválido). A assinatura correta do TypeBox é:

```
Compile(type)                 // sem refs
Compile(context, type)        // context = TProperties ({ '<$id>': schema }) PRIMEIRO
```

Testado: `Compile({ User }, Type.Ref('User'))` **valida corretamente** (rejeita
email/nome inválidos), roda o pipeline `Default→Convert→Clean`, e o schema
**retém `$ref`** (bom para o OpenAPI emitir componentes nomeados). Isso é TypeBox
**nativo** — não AJV. O gatilho foi deixar o **módulo de documentação** fácil de
usar (referenciar schemas por nome), como no tecnoflow/integrator-api.

## Decisão

1. **`createSchema(schema, '$id')`** (`framework/use-case/shared/schemas/create-schema.ts`,
   barrel `@/use-case`) nomeia um schema setando `$id` — **sem registro global**.
   Ex.: `createSchema(Type.Object({...}), 'entities.User')`. O `$id` é lido direto
   do objeto.
2. **O validator declara o que referencia:** `protected override references = [UserSchema]`.
   O `BaseValidator` monta o context do `Compile(context, schema)` a partir dessas
   `references`, então `Type.Ref('<$id>')` resolve. Validators sem ref não declaram
   nada (`references` default `[]` → `Compile({}, schema)`, inofensivo).
3. **Sem estado global nem side-effect de import.** Quem referencia um schema
   fornece-o; não há registro global que precise estar populado na ordem certa.
4. **`@Documentation` pode referenciar por `$id`** (`response: Type.Object({...}, { $id })`
   com `Type.Ref('<$id>')`) — é metadado (não valida); o gerador de OpenAPI futuro
   coleta os schemas referenciados pelas rotas/use cases.

## Consequências Positivas

- `$id`/`Type.Ref` funcionam para validação **e** para documentação, sem AJV.
- O schema referenciado retém `$ref` → OpenAPI nomeia componentes (dedupe).
- Composição (ADR-0005) continua válida e é o caminho **tipado**; refs entram
  quando há schema compartilhado/nomeado ou necessidade de documentação por nome.

## Consequências Negativas / Trade-offs

- **Tipagem:** `Static<Type.Ref<...>>` é `unknown` (e `Type.Ref` só aceita a
  string do `$id`). Num validator que usa ref, o `T` é **fornecido à parte** (não
  sai do `Static` do schema). O `BaseValidator<T extends Static<S>, S>` aceita
  porque `Static<S>` vira `unknown`. → Prefira **composição** quando quiser `T`
  derivado automaticamente; use **ref** quando o ganho (schema compartilhado /
  doc por nome) compensa abrir mão da derivação do tipo.
- **`Type.Composite` não existe** nesta versão do TypeBox — para combinar
  Pick + campos extras use `Type.Intersect([...])` ou o spread
  `Type.Object({ ...Type.Pick(X, [...]).properties, extra })` (ambos testados).
- O validator precisa **declarar `references`** para cada schema que referencia
  por `$id` (boilerplate explícito) — em troca, não há registro global implícito
  nem dependência de ordem de import. `$id` precisa ser único entre as referências.

## Critério de Revisão

Rever quando o gerador de OpenAPI for realmente construído (ADR-024 adiou) — aí
confirmar o mapeamento `$id → components/schemas`. Rever se um schema-fonte for
compartilhado entre bounded contexts (candidato a mover para `core/`).

## Referências

- ADR-0005 (composição — complementado aqui), ADR-0004 (PaginatorSchema),
  ADR-024 do harness-core (TypeBox nativo, sem AJV; OpenAPI adiado).
- kami: `src/framework/use-case/shared/schemas/create-schema.ts`,
  `src/framework/use-case/modules/validator/index.ts` (`buildContext` +
  `Compile(context, schema)`, `protected references`),
  `src/modules/users/domain/schemas/user.schema.ts` (`createSchema(..., 'entities.User')`).
- Inspiração (tecnoflow/integrator-api): `createSchema` + `$id` + `Type.Ref` +
  `schemas.register` (registry global) — aqui em TypeBox nativo e com referências
  **explícitas por validator**, sem o registry global.
