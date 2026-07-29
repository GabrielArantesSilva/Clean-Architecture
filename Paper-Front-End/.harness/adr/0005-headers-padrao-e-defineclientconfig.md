# ADR-0005 — Headers padrão e `defineClientConfig` (config de client reutilizável)

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/core/client.ts`

## Contexto

`createApiClient` só montava o header `Cookie`. Projetos consumidores que
precisam enviar headers padrão (ex.: `X-App`, `Accept-Language`, chaves de
tenant) teriam de passá-los **em toda chamada** de `createApiClient` — repetição
e risco de divergência. Faltava também um análogo a `defineAuthConfig` para fixar
as opções genéricas do client (baseURL, headers, …) num lugar só.

## Decisão

Duas adições, ambas **aditivas** (sem breaking):

1. **`headers?: Record<string, string>`** em `CreateApiClientOptions` — headers
   padrão de toda request. São mesclados com o `Cookie` gerido pelo kit, que
   **sempre vence** (entra por último no merge).
2. **`defineClientConfig(base?): ApiClientFactory`** — captura as opções
   reutilizáveis uma vez e retorna uma **factory** (`createApiClient` pré-amarrado).
   Forma escolhida pelo dev entre factory × config-objeto.
   - Overrides por chamada fazem **shallow-merge** sobre a base;
   - `headers` faz **deep-merge** (uma chamada adiciona header sem perder os da base);
   - `baseURL` cai para a base e, por fim, `getDefaultBaseURL()`.

```ts
export const createClient = defineClientConfig({ headers: { 'X-App': 'kami' } })
const a = createClient()
const b = createClient({ cookieHeader, headers: { 'X-Trace': '1' } })
```

`createApiClient(options)` segue funcionando standalone — a factory é açúcar por
cima, então os entry points internos (`browser-client`, `server-client`) não mudaram.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Só `headers` em options (spread manual) | Mínimo | Merge de headers na mão; não é "definido uma vez" | Não atende ao pedido |
| `defineClientConfig` → objeto + `createApiClient(config, perCall?)` | Fiel ao padrão "config é dado" | Muda assinatura de `createApiClient` (breaking interno) | Dev preferiu factory |
| `defineClientConfig` → factory (escolhida) | Ergonômico; aditivo; merge interno | Retorna função (menos "config-dado") | — |

## Consequências

- **Positivas:** headers padrão definidos num lugar; reuso sem repetição; `Cookie`
  protegido (sempre vence); zero breaking.
- **Negativas / trade-offs:** dois jeitos de criar client (`createApiClient` direto
  e via factory) — documentado para não confundir.
- **Impacto no template:** **não-breaking** — adições puras à API pública
  (`defineClientConfig`, `ApiClientFactory`, campo `headers`).
- **Boundaries afetados:** nenhum. Headers são por-parâmetro/config (não hardcoded),
  coerente com §1.

## Follow-ups

- [x] Atualizar README (API reference, entry points, exemplo de `defineClientConfig`)
- [x] **Correção de regressão de doc:** o rename anterior `useApiContract →
      skipApiContract` (find-replace do dev) inverteu a semântica em vários textos
      (`skipApiContract: false` descrito como "raw"). Código estava certo
      (`if (!skipApiContract)`); textos do README e 2 comentários corrigidos para
      `true` = raw, default `false`.
- [ ] Cobrir com teste quando o runner existir (ver ADR-0001): merge de `headers`
      (base × per-call) e precedência do `Cookie`.
