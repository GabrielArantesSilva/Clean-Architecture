# ADR-0002 — Layout em camadas dentro do módulo (`domain/` + `app/` + `infrastructure/`)

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro

> ✅ **Aplicado em 2026-07-24** após OK do dev. O módulo `modules/users/` migrou
> para `domain/ports/` + `app/` + `infrastructure/database/`, mantendo `IUser`
> anêmico. Ver "Diff aplicado" no fim. Suíte verde (30 unit + 7 db) e typecheck/lint limpos.

## Contexto

Hoje o módulo `modules/users/` é **flat**: use cases, interface do repository
(`users.repository.ts`), impl Drizzle (`users.database.ts`) e rotas convivem no
mesmo nível. O projeto-irmão obras-api consolidou o layout em **três camadas
físicas por módulo** (padrão do time, obras-api ADR-0001 — Clean Architecture):

```
modules/<ctx>/
  domain/ports/<x>-repository.port.ts    (interface + Symbol de DI)
  domain/entities/                       (entidades — quando houver domínio rico)
  domain/errors/                         (erros de domínio — idem)
  app/<caso>.use-case.ts                 (use cases, sub-agrupados por agregado)
  infrastructure/database/<x>.database.ts (impl de acesso a dados)
  <ctx>.routes.ts                        (rotas, no raiz do módulo)
  <ctx>.module.ts                        (DI do módulo — ver ADR-0003)
```

A camada vira **fronteira física**: `domain/` não conhece `infrastructure/`; o
use case (`app/`) depende só da porta (`domain/ports/`); a impl concreta
(`infrastructure/`) implementa a porta. Isso torna a direção de dependência
verificável por caminho de import, não só por convenção.

**Ponto de fundo — entidades ricas vs. anêmico.** O kami hoje é anêmico: `IUser`
é um `type` em `core/database/entities/user.ts`, sem comportamento. O obras usa
`domain/entities/` com construtor que protege invariantes (DDD tático). Adotar
entidades ricas no kami é decisão maior e, no caso dele, provavelmente
**over-engineering**: o context.md diz explicitamente que o kami "não tem
domínio de negócio próprio — é template/implementação de referência". Uma
entidade rica sem regra de negócio real seria cerimônia vazia.

## Opções Consideradas

### Opção 1: Adotar `domain/ports/` + `app/` + `infrastructure/database/`, mantendo `IUser` anêmico
- Prós: alinha o kami ao layout do time (obras); a fronteira de camadas fica
  física e verificável; prepara o terreno sem inventar domínio que não existe.
  `domain/` do users nasce só com `ports/` (sem `entities/`/`errors/`), o que é
  um subconjunto honesto — as pastas aparecem quando um módulo real precisar.
- Contras: mais profundidade de pasta para um módulo de exemplo pequeno; move
  arquivos versionados e ajusta ~8 imports (bootstrap, specs, rotas).

### Opção 2: Adotar as três camadas **e** entidades ricas (`domain/entities/User` com invariantes)
- Prós: espelha o obras 1:1, inclusive DDD tático.
- Contras: inventa comportamento de domínio que o kami não tem; contradiz o
  context.md ("sem domínio próprio"); vira exemplo enganoso — quem copiar vai
  achar que precisa de entidade rica para um CRUD.

### Opção 3: Manter flat (status quo)
- Prós: zero mudança.
- Contras: mantém a referência divergente do layout consolidado do time.

## Decisão

**Proposta:** adotar a **Opção 1**. Layout em camadas com `domain/ports/`
(`.port.ts`), `app/` (use cases) e `infrastructure/database/`, **preservando o
`IUser` anêmico** em `core/database/` (sem `domain/entities/` no módulo `users`
enquanto não houver regra de negócio real). Nomes de classe inalterados
(`UsersDatabase`, `CreateUserUseCase`, `IUsersRepository`).

`domain/entities/` fica documentado como **onde entra** quando um módulo tiver
domínio rico — o kami mostra a estrutura sem forçar o conteúdo. **Atualização
(ADR-0004):** `domain/errors/` **foi adicionado** ao módulo `users` — não como
entidade rica, mas como catálogo de erros de negócio (enum), que faz sentido
mesmo num módulo anêmico.

## Consequências Positivas

- Direção de dependência (domain ← app ← infrastructure) vira física e legível.
- kami e obras compartilham o mesmo layout de módulo — a referência volta a
  refletir o padrão do time.
- Sufixo `.port.ts` deixa explícito o papel "contrato de dependência" (hoje
  `users.repository.ts` mistura interface + Symbol sem marcar a camada).

## Consequências Negativas / Trade-offs

- Mais níveis de pasta para um módulo de demonstração pequeno.
- Move arquivos versionados e ajusta imports em bootstrap, rotas e specs.
- Introduz um `domain/` que (no users) só tem `ports/` — pode parecer
  incompleto para quem espera as três subpastas; mitigado por comentário/README.

## Critério de Revisão

Rever se o kami ganhar um módulo com domínio de negócio real (aí reavaliar
entidades ricas em `domain/entities/`) ou se o time decidir que o layout em
camadas é over-engineering para o papel de referência e voltar ao flat.

## Diff aplicado (2026-07-24)

Moves (via `git mv`):
- `users.repository.ts` → `domain/ports/users-repository.port.ts`
- `users.database.ts` → `infrastructure/database/users.database.ts`
- `create-user.use-case.ts` / `get-user-by-id.use-case.ts` /
  `list-users.use-case.ts` → `app/`
- `__tests__/*.use-case.spec.ts` → `__tests__/app/`;
  `__tests__/users.database.spec.ts` → `__tests__/infrastructure/database/`
- `users.routes.ts` permanece no raiz do módulo.

Imports a ajustar:
- use cases (`app/`): `./users.repository` → `../domain/ports/users-repository.port`
- `users.database.ts`: `./users.repository` → `../../domain/ports/users-repository.port`
- `users.routes.ts`: `./<caso>.use-case` → `./app/<caso>.use-case` (×3)
- `config/bootstrap.ts`: `@/modules/users/users.repository` →
  `.../domain/ports/users-repository.port`; `@/modules/users/users.database` →
  `.../infrastructure/database/users.database`
- specs por alias: `@/modules/users/<caso>.use-case` →
  `@/modules/users/app/<caso>.use-case`; `@/modules/users/users.database` →
  `@/modules/users/infrastructure/database/users.database`
- `server/http/middlewares/__tests__/authenticate.spec.ts`:
  `@/modules/users/users.repository` → `.../domain/ports/users-repository.port`

Verificação: typecheck + `test:unit` + `test:db` verdes; grep sem import órfão.

## Referências

- obras-api: `src/modules/*/{domain,app,infrastructure}`, ADR-0001 (DDD).
- ADR-0001 (nomenclatura kebab-case + sufixo pontuado, base deste layout).
- ADR-0003 (DI por módulo — o `<ctx>.module.ts` que acompanha este layout).
- Boundaries do kami: interface `I<X>Repository` + Symbol continuam no módulo do
  bounded context (aqui, em `domain/ports/`), nunca nos kits.
