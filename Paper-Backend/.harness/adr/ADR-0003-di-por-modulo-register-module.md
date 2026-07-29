# ADR-0003 — DI por módulo (`users.module.ts` / `registerUsersModule`)

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro

> ✅ **Aplicado em 2026-07-24 pela Via A** (ver "Governança"): junto com o
> **ADR-033 do harness-core**, que revê o composition root central do ADR-024
> para "bootstrap único que delega registro por módulo". Com o ADR de time no
> lugar, a implementação de referência (kami) deixa de contradizer o ADR-024.
> Suíte verde — o `users.di.spec.ts` (smoke do container) confirma a fiação.

## Contexto

Hoje o `config/bootstrap.ts` do kami é o **composition root central**: registra
as deps de plataforma (`DatabaseClientSymbol`, `LoggerSymbol`,
`SessionVerifierSymbol`) **e** liga o Symbol de cada bounded context à sua impl:

```ts
container.register(UsersRepositorySymbol, { useClass: UsersDatabase })
```

O comentário do arquivo diz: *"Composition root de DI (ADR-024): liga cada Symbol
ao adapter concreto — único lugar que conhece as implementações."*

O obras-api evoluiu isso (obras-api ADR-0018): o bootstrap continua **único e
roda uma vez**, mas **delega** o grafo de cada contexto a um registrador do
próprio módulo — `registerWorkGoalModule()`, etc. O bootstrap fica com uma linha
por módulo; cada módulo passa a ser dono da sua ligação Symbol → impl:

```ts
// modules/users/users.module.ts
export function registerUsersModule(): void {
  container.register(UsersRepositorySymbol, { useClass: UsersDatabase })
}
// config/bootstrap.ts
registerUsersModule()
```

## Governança / conflito com o ADR-024 (harness-core)

O ADR-024 é **org-wide** (vive em `~/.harness-core`) e cita o
`kami-backend/src/config/bootstrap.ts` como a **implementação de referência** do
composition root. Seu item 2 afirma: *"O `config/bootstrap.ts` é o composition
root que liga cada Symbol ao adapter concreto."*

Esta proposta **não** elimina o composition root — o bootstrap continua único,
rodando uma vez, dono das deps de plataforma. Ela **refina** o "liga cada Symbol"
para "liga plataforma e **delega** o grafo de cada módulo". É a mesma leitura que
o obras-api já assumiu no ADR-0018. Mas, como o kami é a referência que o
ADR-024 aponta, mudar o padrão dele muda o que o ADR-024 documenta.

**Decisão de governança é do humano** — duas vias:

- **Via A (recomendada):** abrir um **ADR de time no harness-core** (ex.: ADR-033)
  que reveja o item 2 do ADR-024 para "bootstrap único que delega registro por
  módulo", tornando o padrão org-wide; o kami implementa e este ADR-0003 local
  vira o registro da aplicação no kami. Alinha kami + obras + harness-core.
- **Via B:** manter o ADR-024 como está e este ADR-0003 documentar uma
  divergência **local** do kami — ruim para uma implementação de referência, que
  passaria a contradizer o ADR que a cita.

## Opções Consideradas

### Opção 1: DI por módulo (`registerUsersModule`), bootstrap delega
- Prós: cada módulo é dono do seu grafo; adicionar módulo = 1 import + 1 chamada
  no bootstrap (não N linhas de `container.register`); alinha com obras-api;
  co-localiza a fiação com a camada `infrastructure/` do módulo (ADR-0002).
- Contras: conflita com a letra do ADR-024; a ligação Symbol→impl deixa de estar
  toda num só arquivo (trade-off de localidade vs. visão central).

### Opção 2: Manter composition root central (status quo, ADR-024)
- Prós: um único arquivo mostra todo o grafo; zero conflito de ADR.
- Contras: o bootstrap cresce por módulo; diverge do obras; a fiação de um
  módulo fica longe do módulo.

## Decisão

Adotada a **Opção 1 pela Via A** — DI por módulo com o bootstrap delegando,
acompanhada do **ADR-033 do harness-core** que revê o item 2 do ADR-024. kami,
obras-api (ADR-0018) e harness-core convergem no mesmo padrão de DI.

## Consequências Positivas

- Registrar módulo novo = adicionar `registerXModule()` no bootstrap.
- Fiação co-locada com o módulo (casa com o layout em camadas do ADR-0002).
- kami, obras e harness-core convergem no mesmo padrão de DI.

## Consequências Negativas / Trade-offs

- Perde-se a visão "todo o grafo num arquivo"; a ligação Symbol→impl espalha por
  `*.module.ts`. Mitigado pelo `*.di.spec.ts` (smoke test do container).
- Exige mexer no harness-core (ADR de time) para não deixar a referência
  contradizendo o ADR-024.

## Critério de Revisão

Rever junto com o ADR de time que revê o ADR-024. Se o time decidir manter o
composition root central como padrão org-wide, este ADR é rejeitado.

## Diff aplicado (2026-07-24)

- **Novo** `modules/users/users.module.ts` com `registerUsersModule()` (registra
  `UsersRepositorySymbol` → `UsersDatabase`).
- `config/bootstrap.ts`: remover o `import { UsersDatabase }`,
  `import { UsersRepositorySymbol }` e a linha `container.register(...)`; manter
  as deps de plataforma; adicionar `import { registerUsersModule }` + chamada.
  Atualizar o comentário que cita ADR-024 para refletir a delegação (e apontar o
  novo ADR de time).
- Sem mudança de comportamento: o `users.di.spec.ts` (smoke do container)
  continua verde por definição.

Verificação: typecheck + `test:unit` + `test:db` verdes.

## Referências

- ADR-024 do harness-core (composition root central — **revisto por esta
  proposta**).
- obras-api ADR-0018 (DI única com tsyringe, bootstrap único que delega).
- ADR-0002 (layout em camadas — o `infrastructure/` onde a impl registrada mora).
