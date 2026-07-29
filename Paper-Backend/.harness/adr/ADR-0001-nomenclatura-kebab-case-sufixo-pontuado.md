# ADR-0001 — Nomenclatura de arquivos: kebab-case + sufixo pontuado (e pasta de teste `__tests__`)

**Data:** 2026-07-24
**Status:** Aceito
**Autores:** Lucas Ribeiro

> **Escopo de numeração:** este é o primeiro ADR **local** do kami-backend
> (`.harness/adr/`, série `ADR-NNNN` com 4 dígitos, começando em `0001` — mesma
> convenção do projeto-irmão obras-api). Não confundir com os ADRs de **time**
> (`~/.harness-core/.harness/adr/`, série `ADR-0XX`: ADR-021/023/024/025/026),
> que são org-wide e continuam sendo citados aqui pelo número original. Quando
> houver ambiguidade, cite "ADR-0XX do harness-core".

## Contexto

O kami-backend é a implementação de referência do back-end Node.js da Origami
(ADR-021/023 do harness-core). O projeto-irmão obras-api adotou os padrões do
kami e, no processo, consolidou uma convenção de **nomenclatura de arquivo** que
hoje é o padrão estrutural do time: kebab-case com sufixo pontuado
(`create-user.use-case.ts`, `users.database.ts`, `users-repository.port.ts`).

O kami, porém, ainda carregava resíduos de um estilo anterior:

- use cases em camelCase com sufixo camelCase: `createUser.useCase.ts`,
  `getUserById.useCase.ts`, `listUsers.useCase.ts`;
- uma entity em PascalCase: `core/database/entities/User.ts`;
- specs em camelCase dentro de `__tests__/`: `createUser.useCase.spec.ts`.

Como o kami é a referência que os outros projetos leem sob demanda (ADR-018), o
drift de nomenclatura entre ele e o obras enfraquece o papel de "fonte de
verdade". Isto é um alinhamento estrutural — **rename puro, sem mudança de
comportamento**: nenhuma rota, contrato HTTP ou envelope `{ process, body }`
muda; os nomes de **classe** (`CreateUserUseCase`, `IUser`, etc.) são
preservados; só o nome do arquivo e os imports que o referenciam mudam.

## Opções Consideradas

### Opção 1: kebab-case + sufixo pontuado (`.use-case.ts`, `.database.ts`, `.port.ts`, `.spec.ts`)
- Prós: alinha kami e obras-api sob a mesma convenção do time; sufixo pontuado
  torna a natureza do arquivo legível no explorer e em imports; kebab-case
  evita as armadilhas de case-sensitivity entre sistemas de arquivo (reforça o
  `forceConsistentCasingInFileNames` já ligado no tsconfig).
- Contras: renomeia arquivos versionados (ruído pontual no histórico, mitigado
  por `git mv` que preserva o rename); exige varrer imports/barrels a cada move.

### Opção 2: manter camelCase/PascalCase como estava
- Prós: zero mudança, zero ruído no histórico.
- Contras: mantém o kami divergente do obras e do padrão consolidado do time —
  a referência deixa de refletir o padrão que ela mesma deveria ditar.

## Decisão

Escolhemos a **Opção 1** para todo o `src/`:

1. **Sufixo pontuado em kebab-case** para todo arquivo com papel de camada:
   `*.use-case.ts`, `*.database.ts`, `*.repository.ts`, `*.routes.ts`,
   `*.port.ts`, `*.adapter.ts`, `*.factory.ts`, `*.spec.ts`.
2. **Base do nome em kebab-case**: `createUser.useCase.ts` →
   `create-user.use-case.ts`; `getUserById.useCase.ts` →
   `get-user-by-id.use-case.ts`; `listUsers.useCase.ts` →
   `list-users.use-case.ts`. Entity PascalCase `entities/User.ts` →
   `entities/user.ts`.
3. **Nomes de classe/tipo permanecem** (`CreateUserUseCase`, `GetUserByIdUseCase`,
   `ListUsersUseCase`, `IUser`): a convenção governa o arquivo, não o símbolo.
4. **Specs em kebab-case**, espelhando a árvore do código-fonte (cada diretório
   mantém a sua própria pasta de teste co-locada, não um flat único).
5. **Pasta de teste permanece `__tests__/`** — decisão explícita do dev nesta
   sessão. Aqui o kami **diverge conscientemente** do obras-api, que usa
   `_test_/`. A convenção cobrável do time é kebab-case + sufixo pontuado nos
   *arquivos*; o nome da *pasta* de teste (`__tests__`, padrão amplamente
   reconhecido por ferramentas e devs) fica a critério do projeto.

O glob de teste do Vitest é agnóstico ao nome da pasta (`**/*.spec.ts`), então a
escolha `__tests__` vs `_test_` não afeta a execução.

## Consequências Positivas

- kami e obras-api compartilham a mesma convenção de nomenclatura de arquivo;
  a referência volta a refletir o padrão do time.
- Natureza de cada arquivo fica legível pelo sufixo, sem abrir o conteúdo.
- Base para o Tier 2 (camadas `domain/`/`app/`/`infrastructure/` + `.port.ts`):
  os sufixos pontuados já são o vocabulário que aquelas camadas usam.

## Consequências Negativas / Trade-offs

- Divergência pontual e assumida em relação ao obras no nome da pasta de teste
  (`__tests__` no kami × `_test_` no obras). Registrada aqui para não virar
  "bug" de inconsistência: é escolha, não descuido.
- Rename de arquivos versionados gera ruído único no histórico (mitigado por
  `git mv`).
- Pointers do harness-core (`patterns/backend.md`) que citem caminhos por nome
  de arquivo do kami precisam ser conferidos (ver Referências).

## Critério de Revisão

Rever se o time decidir promover o nome da pasta de teste a convenção cobrável
(padronizando `__tests__` ou `_test_` para todos os projetos) — nesse caso este
ADR é supersedido por um ADR de time no harness-core. Rever também se surgir uma
ferramenta cujo glob dependa do nome da pasta.

## Referências

- Projeto-irmão obras-api: `src/modules/**` (kebab + sufixo pontuado),
  `.harness/adr/ADR-0016-divergencia-stack-kami-backend.md`.
- ADR-018 do harness-core (kami consumido por leitura sob demanda) — conferir se
  `~/.harness-core/.harness/patterns/backend.md` referencia
  `createUser.useCase.ts`/`getUserById.useCase.ts`/`listUsers.useCase.ts` por
  caminho; se sim, atualizar o pointer.
- ADR-024/025 do harness-core (estrutura `framework/` + `core/database/`).
