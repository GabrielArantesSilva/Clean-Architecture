# ADR-0005 — Reuso de schema de validação por composição nativa do TypeBox (sem registry AJV)

**Data:** 2026-07-24
**Status:** Aceito — revisto pelo ADR-0006
**Autores:** Lucas Ribeiro

> ✅ **Aplicado em 2026-07-24.** Estabelece como validators reusam campos
> repetidos: schema-fonte compartilhado + `Type.Pick`/`Omit`/`Partial`. Suíte
> verde; as asserções de validação do `create-user` provam que o schema composto
> valida idêntico ao inline anterior.
>
> ⚠️ **Revisto pelo [ADR-0006].** Este ADR concluiu que registry/`$id`/`Type.Ref`
> eram "mecânica de AJV" e não funcionariam no `Compile` nativo — **isso estava
> errado** (eu usei a assinatura errada do `Compile`). O ADR-0006 mostra que
> `Compile(context, schema)` resolve refs nativamente e habilita `$id`/registry
> sem AJV. A **composição** deste ADR segue válida (é o caminho tipado); refs são
> a alternativa para schema nomeado/compartilhado e documentação.

## Contexto

Conforme os módulos crescem, muitos validators repetem os mesmos campos (ex.:
`email`, `name`). Redeclarar o schema TypeBox em cada validator gera divergência
(um muda o `minLength`, outro não). Precisamos de uma forma de definir o campo
**uma vez** e reusar na tipagem e no validator.

O `tecnoflow`/`integrator-api` resolvem com um **schema-fonte por entidade**
(`userSchema = createSchema(Type.Object({...}), '/entities/User')`) e:
- validators compõem via `Type.Composite([Type.Pick(userSchema, [...]), ...])`;
- referências por `$id` via `Type.Ref(enumSchema.$id)`;
- um **registry**: `schemas.register([userSchema])`.

O detalhe crítico: esse registry + `$id` + `Type.Ref` é mecânica da **era AJV** —
o AJV resolve `$ref` por `$id` a partir de um registro (e serve à geração de
OpenAPI). O **kami não usa AJV** (ADR-024 do harness-core: TypeBox nativo via
`typebox/compile`), e o `BaseValidator` chama `Compile(schema)` **sem** passar um
array de `references`. Então `Type.Ref`/registry **não resolveria** aqui hoje.

## Opções Consideradas

### Opção 1 (escolhida): reuso por composição nativa (`Type.Pick`/`Omit`/`Partial`)
- Prós: `Type.Pick(UserSchema, ['email','name'])` **inlina** os campos num
  `TObject` materializado — o `Compile` nativo processa direto, sem registry,
  sem `$id`, sem `Type.Ref`. Zero máquina extra; alinhado ao "TypeBox nativo"
  do ADR-024. Verificado: `Compile` de schema `Pick` valida/rejeita correto.
- Contras: sem `$id`, não há dedupe por referência para um futuro OpenAPI (o
  ADR-024 já adiou OpenAPI — quando vier, `Compile` aceita um array de
  `references` e aí se reavalia um registry).

### Opção 2: portar o registry `$id` + `Type.Ref` do tecnoflow
- Rejeitada: traz mecânica de AJV para um back que decidiu **não** usar AJV;
  exigiria ensinar o `BaseValidator` a passar `references` ao `Compile` e manter
  um registro global — máquina morta enquanto não houver OpenAPI. Contraria o
  ADR-024.

## Decisão

1. **Schema-fonte compartilhado por módulo** em `domain/schemas/<x>.schema.ts`
   (ex.: `UserSchema` em `modules/users/domain/schemas/user.schema.ts`), com os
   campos e suas restrições definidos uma vez. `email` usa `pattern` (não
   `format` — sem AJV o format não roda nativo, ADR-024).
2. **Validators compõem** a partir dele:
   - subconjunto: `Type.Pick(UserSchema, ['email', 'name'])` (usado no
     `CreateUserValidator`);
   - exclusão: `Type.Omit(UserSchema, ['id'])`;
   - todos opcionais (ex.: update parcial): `Type.Partial(UserSchema)`;
   - campos extras: **spread** `Type.Object({ ...Type.Pick(UserSchema, [...]).properties, extra: ... })`
     ou `Type.Intersect([...])`. **`Type.Composite` não existe** nesta versão do
     TypeBox — preferir o spread (gera um `TObject` plano, melhor para o pipeline
     `Default→Convert→Clean`).
3. **`type T` deriva do schema composto** (`Static<typeof Validator.schema>`) —
   uma fonte só para tipagem e validação.
4. **Sem registry/`$id`/`Type.Ref`** enquanto não houver OpenAPI.

## Consequências Positivas

- Campo definido uma vez; validators reusam sem redeclarar — sem divergência.
- Nenhuma dependência ou máquina de AJV; coerente com o ADR-024.
- `type T` e schema saem da mesma fonte (composição), sem drift.

## Consequências Negativas / Trade-offs

- Sem `$id`, um futuro gerador de OpenAPI não terá dedupe por referência — quando
  OpenAPI entrar, reavaliar passar `references` ao `Compile` e um registry.
- Schemas-fonte de entidades compartilhadas entre módulos ainda não têm lar
  definido (por ora cada schema-fonte é do seu módulo, em `domain/schemas/`).

## Critério de Revisão

Rever quando o time adotar geração de OpenAPI (ADR-024 adiou) — aí decidir entre
manter composição pura ou introduzir registry + `references` no `Compile`. Rever
também se surgir um schema-fonte usado por mais de um bounded context (candidato
a `core/`).

## Referências

- ADR-024 do harness-core (TypeBox nativo, sem AJV; OpenAPI adiado).
- ADR-0004 (PaginatorSchema reutilizável — mesmo princípio de composição).
- kami: `src/modules/users/domain/schemas/user.schema.ts`,
  `src/modules/users/app/create-user.use-case.ts` (`Type.Pick`).
- Inspiração externa (tecnoflow/integrator-api): `createSchema` + `$id` +
  `Type.Ref` + `schemas.register` — mecânica de AJV, não adotada aqui.
