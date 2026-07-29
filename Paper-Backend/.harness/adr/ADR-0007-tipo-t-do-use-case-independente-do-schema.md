# ADR-0007 — O tipo `T` do use case é definido independente do schema de validação

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro

> ✅ **Aplicado em 2026-07-24.** Refactor de tipo (sem mudança de comportamento).
> Suíte verde (43 unit + 9 db), typecheck e lint limpos.

## Contexto

Os use cases derivavam o tipo de entrada do próprio schema:

```ts
type T = Static<typeof CreateUserValidator.schema>
class CreateUserValidator extends BaseValidator<T, typeof CreateUserValidator.schema> { ... }
```

Isso cria uma **dependência circular**: `T` depende do schema (`Static<... schema>`),
e o `BaseValidator<T extends Static<S>, S>` valida o schema **contra** `T`. Ou
seja, o schema define `T` e `T` restringe o schema — os dois se referenciam. Além
do acoplamento, o padrão quebra quando o schema usa `Type.Ref`: aí `Static<S>` é
`unknown` (ADR-0006) e `T` viraria `unknown`.

## Decisão

**`T` é definido independentemente do schema** — é o contrato de entrada do use
case. O `BaseValidator<T extends Static<S>, S>` passa a ter um papel único: em
compile-time, **verificar** que o schema cobre o `T` (uma direção, sem ciclo).

`T` pode ser um tipo de domínio existente ou escrito à mão:

```ts
// reusa tipo existente
type T = ICreateUserParams          // create-user (== params do repositório)
type T = IPaginator                 // list-users (tipo do kit database)
// ou explícito
type T = { userId: string }         // get-user-by-id
```

Se `T` e o schema divergirem (ex.: schema exige campo que `T` não tem), o
`T extends Static<S>` **falha o typecheck** — a verificação continua, só deixou
de ser circular.

## Consequências Positivas

- Sem dependência circular `T <-> schema`.
- Funciona igual para validators com `Type.Ref` (onde `Static<S>` é `unknown`):
  `T` já vem à parte (ADR-0006), agora de forma consistente em todos os casos.
- `T` fica explícito e legível — o contrato de entrada não se esconde atrás de um
  `Static<>`.

## Consequências Negativas / Trade-offs

- `T` não se atualiza sozinho quando o schema ganha um campo **opcional** (o
  `extends Static<S>` só falha para campo **obrigatório** novo). É o preço da
  independência — o `T` é a fonte da verdade do contrato, não o schema.

## Critério de Revisão

Rever se o time preferir T derivado automaticamente onde não houver `Type.Ref`
(voltaria a acoplar T ao schema, sem o ciclo, movendo o schema para uma const
fora da classe) — decisão de estilo a reavaliar se o boilerplate incomodar.

## Referências

- ADR-0004/0005/0006 (autoria de use case, composição, registry/refs).
- kami: `src/modules/users/app/*.use-case.ts` (`type T` independente).
