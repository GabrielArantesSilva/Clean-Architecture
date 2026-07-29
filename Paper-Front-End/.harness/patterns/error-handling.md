# Pattern — Tratamento de Erro

> O padrão de erro **mais maduro do Kami hoje**. Ancorado no pipeline de
> interceptors do `next-http-client`. Replicar este modelo em novos clients.

## O envelope `use-case-core`

A API responde no formato:

```ts
type ApiResponse<T> =
  | { process: 'success'; body: T }      // body = dado
  | { process: 'failed';  body: string } // body = mensagem de erro
```

Type guards (`@types/use-case-core.ts`): `isApiResponse`, `isFailedResponse`.
**Sempre** valide o shape com eles antes de confiar na resposta.

## Pipeline de interceptors — ordem é contrato

Registrados em `client.ts` **nesta ordem** (axios executa response interceptors
na ordem de registro):

1. **Auth** — vê o 401 cru primeiro, tenta refresh + retry. Um 401 recuperado
   **nunca** chega aos interceptors seguintes.
2. **UseCaseCore** — desempacota `success` (`response.data = data.body`) ou
   **rejeita** `failed` convertendo `body` (string) na `message` do erro.
3. **Error** — resolve a mensagem final e dispara o toast (só no browser),
   respeitando `ignoredErrors`, e **re-lança** o erro.

> ⚠️ **NÃO reordene** sem reler a semântica do axios. Flipar a ordem faz o toast
> disparar em todo 401 mesmo quando o auth recupera. O comentário em `client.ts`
> documenta isso — mantenha-o.

## Três categorias de erro

| Categoria | Origem | Como o Kami trata |
|-----------|--------|-------------------|
| **Transporte** | rede caiu, sem `response`, `ERR_NETWORK` | mensagem genérica de conexão (pt-BR) |
| **HTTP/Auth** | 401 | auth interceptor tenta refresh → retry; só falha se irrecuperável |
| **Negócio** | envelope `failed` | rejeita com `body` como mensagem; toast mostra |

## Flags de controle por request

- **`ignoredErrors: string[] | '*'`** — suprime toast para mensagens que casam
  (ou todas, com `'*'`). Usado no refresh para não "piscar" erro ao usuário.
- **`skipEnvelopeUnwrap: true`** — pula o unwrap para endpoints fora do padrão
  envelope.
- **`retried: true`** — interno; marca request já reexecutada pós-refresh
  (anti-loop). Não setar manualmente em código de feature.

## Regras

- Mensagem ao usuário é **genérica e em pt-BR**; nunca vaze detalhe interno.
- Erro sempre é **re-lançado** após o efeito colateral (toast) — o chamador
  ainda precisa poder tratar. Interceptor não "engole" erro.
- Novo client/serviço? Reaproveite estes interceptors ou siga o mesmo desenho
  (recuperação → normalização → feedback → re-throw).

## Anti-padrões

- ❌ `try/catch` que engole o erro sem re-lançar nem sinalizar.
- ❌ Toast disparado manualmente espalhado pelas features (centralize no
  interceptor; use `ignoredErrors` para casos especiais).
- ❌ Tratar `response.data` sem checar o envelope com type guard.
- ❌ `catch (e: any)` — tipar como `unknown`/`AxiosError` e estreitar.
