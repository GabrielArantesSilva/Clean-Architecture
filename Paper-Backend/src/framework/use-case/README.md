# Kit `use-case/`

O "framework" de use cases do kami-backend. Define o **contrato** que toda regra
de negócio segue e o **envelope** de resposta — o mesmo que o http-client do
kami-front-end espera (`{ process, body }`). É autocontido e extraível para
`packages/use-case` sem reescrever import (ADR-023).

## Por que existe

Padronizar como um use case é escrito, validado, executado e como seu erro/sucesso
viram resposta HTTP — para que qualquer transporte (HTTP hoje, fila amanhã) apenas
chame `handle(data)` e receba `{ process, body }`. Validação e regra de negócio
moram **só aqui** (ADR-021), nunca no controller/middleware.

## Layout

```
use-case/
  index.ts                     contrato público (barrel) — importe SEMPRE daqui
    IUseCase / IWrappedUseCase  a interface do use case e a versão embrulhada
    UseCaseHandler              valida -> execute -> SuccessResponse; captura HttpException
    UseCaseFactory.create()     lê @ValidateWith/@Documentation e monta o handler
  modules/
    validator/                 BaseValidator (TypeBox Compile nativo, sem AJV) + @ValidateWith
    documentation/             @Documentation (metadata p/ OpenAPI futuro — não gera spec ainda)
  shared/utils/
    exceptions.ts              HttpException + subclasses (400/401/403/404/409/424/429/500)
    response.ts                ProcessOptions, SuccessResponse, envelope { process, body }
    decorators.ts              leitura de metadata (reflect-metadata)
```

## Anatomia de um use case (o padrão a replicar)

```ts
type T = Static<typeof Validator.schema>
type K = /* o que o use case devolve */

@injectable()
@ValidateWith(() => Validator)
export class FazAlgoUseCase implements IUseCase<T, K> {
  constructor(
    @inject(AlgoRepositorySymbol) private readonly repo: IAlgoRepository,
  ) {}

  // recebe T já validado; devolve K puro (o UseCaseHandler embrulha no envelope).
  async execute(data: T): Promise<K> {
    const achou = await this.repo.findById(data.id)
    if (!achou) throw new NotFoundException('nao encontrado') // recusa via HttpException
    return achou
  }
}

// Validator co-locado no fim do arquivo. schema como `static readonly` p/ o `type T` derivar.
class Validator extends BaseValidator<T, typeof Validator.schema> {
  static readonly schema = Type.Object({ id: Type.String({ minLength: 1 }) })
  protected schema = Validator.schema
  // include?(data) { ... }  // validação cross-field opcional, roda após o schema
}
```

## Validação sem AJV

`BaseValidator` usa o `Compile` nativo do TypeBox v1. O pipeline
`Default -> Convert -> Clean -> Check` recupera o que o AJV dava no tecnoflow:
aplica `default`, coage query string para o tipo (`"2"` -> `2`) e remove campo
fora do schema. `format` (email/uri) **não** roda nativo — use `pattern`.

## Como adicionar um use case

1. Crie `meuCaso.useCase.ts` no módulo do bounded context com a anatomia acima.
2. As deps entram por `@inject(Symbol)` — registre o Symbol no `config/bootstrap.ts`.
3. Ligue-o a uma rota no `*.routes.ts` do módulo (ver `server/http/README.md`).
4. Teste: `execute` com repo mockado; validação/envelope via `UseCaseFactory.create(uc).handle(...)`.

## Gotchas

- `execute` **não** valida nem embrulha — quem valida é o `@ValidateWith`, quem
  embrulha é o `UseCaseHandler`. Um `throw new Error(...)` (não-HttpException) vira
  `500` genérico; para recusar request use uma subclasse de `HttpException`.
- Importe sempre do barrel, via alias `@/use-case`, nunca dos caminhos internos
  (`shared/utils/...`) — o barrel é o contrato estável. Dentro do framework os
  imports são relativos (autocontenção — ADR-025/026).
- `SuccessResponse` responde sempre `status_code: 200` (inclusive POST de criação).
