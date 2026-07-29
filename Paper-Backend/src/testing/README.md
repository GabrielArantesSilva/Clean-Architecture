# `testing/` — padrões de teste

Vitest, com dois níveis que **não** se misturam (pirâmide da qa-skill):

| Nível | Alvo | Banco | Script |
|---|---|---|---|
| Unitário | use cases (lógica + validação) e helpers puros | mock do repository | `pnpm test:unit` |
| Integração | `*.database.ts` (a query É o teste) | **Postgres real** via Testcontainers | `pnpm test:db` |

`test:unit` é rápido e roda sempre (sem Docker); `test:db` sobe o primitivo e roda
no commit/CI. Nunca se mocka o banco em `*.database.ts` (boundaries.md/ADR-011/022).

## Layout

```
testing/
  test-db.ts / test-db.contract.ts   primitivo Testcontainers (startTestDb)
  cli-up.ts                          db:test:up (Postgres efêmero avulso)
  dados.sql                          massa de teste (só dado sintético)
  support/                           kit de apoio aos specs
    factories.ts                     buildUser(overrides) — defaults sensatos
    mocks.ts                         buildUsersRepositoryMock/buildLoggerMock (vitest-mock-extended)
vitest.setup.ts                      reflect-metadata + env sintético (setupFiles)
```

## Teste de use case (mock do repository)

Validação agora é externa ao `execute` (via `@ValidateWith`), então:
- **lógica** → chame `useCase.execute(input)` com o repository mockado;
- **validação/envelope** → chame `UseCaseFactory.create(useCase).handle(input)` e
  verifique `process`/`status_code`.

```ts
const usersRepository = buildUsersRepositoryMock()   // todos os métodos viram spy
usersRepository.create.mockResolvedValue(buildUser())
const uc = new CreateUserUseCase(usersRepository, buildLoggerMock())

await uc.execute({ email: 'a@b.com', name: 'Ana' })                  // lógica
await UseCaseFactory.create(uc).handle({ email: 'x', name: 'Ana' })  // validação -> 400
```

`vitest-mock-extended` gera os mocks a partir da interface: adicionar um método
em `I<X>Repository` não quebra spec algum.

## Teste de `*.database.ts` (Postgres real)

`startTestDb()` sobe o container, aplica a migration do drizzle e semeia
`dados.sql`. Cada teste isola com `truncate()` + `seed()`. Cubra as três (+1)
camadas: caminho feliz, negação (not found, unique), query perigosa (prove pelo
que **não** apagou) e paginação (página respeita o limite, total conta tudo).

## Smoke test de DI

Um `*.di.spec.ts` por módulo roda `bootstrap({ db: mock<Db>() })` e afirma que
`container.resolve(UseCase)` não lança — pega um Symbol esquecido no bootstrap
antes de produção.

## Gotchas

- `reflect-metadata` é carregado no `vitest.setup.ts` — sem ele, classes com
  decorator estouram ao serem avaliadas.
- `test:db` precisa de Docker; o split de scripts existe para o unit não depender dele.
- `dados.sql`: só dado sintético, nunca segredo/credencial real (boundaries.md).
