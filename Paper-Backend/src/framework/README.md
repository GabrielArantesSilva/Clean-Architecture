# `framework/` — os módulos-guia

O critério desta pasta é um só: **o que mora aqui copia intacto entre projetos**
(ADR-025). Nenhum arquivo do framework importa nada de fora dele (além de libs)
— por isso um projeto novo (monorepo ou não) começa copiando esta pasta inteira.

| Kit | O que dá | README |
|---|---|---|
| `use-case/` | contrato `IUseCase`, `UseCaseHandler`/`Factory`, `BaseValidator` (TypeBox), `@ValidateWith`/`@Documentation`, `HttpException`, envelope `{ process, body }` | [use-case/README.md](use-case/README.md) |
| `database/` | factory Drizzle paramétrica, contexto de transação (AsyncLocalStorage), `DrizzleBaseRepository<TDb>`, paginação | [database/README.md](database/README.md) |
| `http/` | routing declarativo (`registerRoutes`/`IRoute`), `applyUseCase` (request → use case → envelope) | — |

O que **não** mora aqui (e é reescrito por projeto):

- `core/` — fundação DESTE app: auth (porta/adapter de sessão), logger,
  `core/database/` (schema Drizzle, entities, alias `Db`).
- `server/` — composição dos transportes (`server/http/app.ts`, entrypoint).
- `modules/` — bounded contexts (use cases, repositories, rotas).
- `config/bootstrap.ts` — o wiring de DI (liga Symbols do framework às impls do app).

## Como consumir

Cada kit tem alias direto (tsconfig `paths` — ADR-026): `@/use-case`,
`@/database`, `@/http`. O resto do app usa `@/*` (`@/core/database`,
`@/modules/users/...`, `@/env`). Sem sufixo `.js` em import nenhum.

```ts
import { BaseValidator, ValidateWith, type IUseCase } from '@/use-case'
import { DrizzleBaseRepository, type IPaginator } from '@/database'
import { registerRoutes, type IRoute } from '@/http'
```

Num monorepo, cada kit daqui vira um `packages/<kit>` literal — sem reescrever
import interno, porque os kits só se referenciam por caminho relativo dentro de
`framework/`; os consumidores trocam o alias pelo nome do pacote (mesma forma:
um specifier curto).
