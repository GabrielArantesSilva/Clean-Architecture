# ADR-0011 — Cache opt-in no http-client (axios-cache-interceptor)

- **Status:** Aceito
- **Data:** 2026-06-26
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/` (camada de cache de respostas)
- **Emendas:** 2026-06-29 — geração de chave (`id` como prefixo) e invalidação por regex
  (ver seção **Emenda 2026-06-29** ao final). A decisão original (opt-in) permanece inalterada.

## Contexto

O http-client não tinha cache: toda chamada ia à rede. Queremos uma camada de cache de
respostas **padronizada** no kit, mas como o Kami é **template replicado**, ela precisa ser
**segura por construção** e **não-intrusiva** para os projetos consumidores:

- Cache ligado por padrão é perigoso num template — cada projeto tem endpoints diferentes, e
  cachear sem o dev pedir leva a dados velhos silenciosos. O default precisa ser **não cachear**.
- O contrato use-case-core entrega **falhas como 4XX/5XX** com `{ process:'failed', body }`.
  Cachear uma falha congelaria um erro transitório por todo o TTL.
- A ordem dos response interceptors (`Auth → Contract → Error`) é **contrato** no `client.ts`
  (inverter faz o toast disparar em 401 que o auth recuperaria) — a camada de cache não pode
  perturbá-la.
- O kit roda em browser **e** no Edge/SSR (proxy, server-client); qualquer dependência precisa
  ser edge-safe e não vazar dado entre requests no servidor.
- Toda dependência nova é **herdada por todos os consumidores** (boundary 4 → exige ADR).

## Decisão

Adotar **`axios-cache-interceptor` (v1)** como camada de cache, em modo **opt-in**:

1. **Opt-out por padrão.** `setupCache(client, { enabled: false, … })` deixa o cache desligado
   globalmente. Uma chamada só cacheia se passar `{ cache: { enabled: true } }`.
2. **Registrado por ÚLTIMO** no pipeline (`Auth → Contract → Error → Cache`). Como os response
   interceptors rodam em ordem de registro, o cache:
   - só **acrescenta** um estágio — não reordena os três existentes;
   - guarda o `body` **já desembrulhado** pelo Contract (hit = miss para quem consome);
   - fica **fora** do caminho de erro/refresh do Auth.
3. **Só 2xx é cacheável.** `cachePredicate` é restrito a `status >= 200 && status < 300`. O
   predicate **padrão** da lib cachearia também `404/405/410/414/501` — o que cachearia as
   falhas 4XX/5XX do use-case-core. Restringir a 2xx garante que **falha nunca é cacheada**.
4. **TTL padrão 60s**, `interpretHeader: false` (o TTL que o dev escolhe é autoritativo, sem o
   `Cache-Control` do servidor sobrescrever em silêncio), **storage `buildMemoryStorage`**
   (JS puro — edge/browser-safe).
5. **Configurável por projeto** via opção `cache?: Partial<CacheProperties>` na factory /
   `createApiClient` (ex.: outro TTL), sem mudar o contrato de opt-in.
6. **Tipagem:** `createApiClient`/factory passam a retornar `AxiosCacheInstance` (superset de
   `AxiosInstance`), o que tipa a opção `cache` em toda chamada **sem** augmentation global nem
   `any` — a lib não faz `declare module 'axios'`.

Opt-in na chamada: `client.get(url, { cache: { enabled: true } })`
(decisão de usar a **config nativa da lib, sem helper** — ver Alternativas).

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| **Opt-in nativo + 2xx + cache por último (escolhida)** | Seguro por padrão; falha nunca cacheada; pipeline intacto; tipado sem `any` | Exige `enabled:true` explícito (footgun documentado) | — |
| Opt-out invertido (cache ligado, desliga por chamada) | Menos verboso quando se quer cache | Perigoso num template: dado velho silencioso em todo projeto | Contraria o pedido e a segurança-por-construção |
| Helper `withCache()` exportado | Mata o footgun do `enabled:true` | + 1 export público no template; diverge da doc da lib | Dev preferiu config nativa |
| Cache **antes** do Contract (cache-first) | Guarda o envelope cru | Insere interceptor antes do Auth; guarda dado pré-unwrap; mais risco com `staleIfError` no caminho de erro | Sem ganho; mais risco |
| Predicate padrão da lib | Zero config | Cachearia 404/410/501 → falhas do contrato cacheadas | Quebra a semântica de erro do kit |

## Consequências

- **Positivas:** cache padronizado e seguro por padrão; falhas nunca cacheadas; `response.cached`
  disponível; configurável por projeto; pipeline existente preservado.
- **Negativas / trade-offs:** opt-in exige `enabled: true` (passar só `{ cache: { ttl } }` não
  cacheia — documentado em README com ⚠️ e no FAQ). Nova dependência herdada por todos os
  projetos (~16 KiB, focada). Cache server-side é per-request (sem benefício real; uso é browser).
- **Impacto no template:** **não-breaking.** A API pública (`createApiClientFactory`,
  `createApiClient`) ganha um campo opcional `cache`; o retorno passa de `AxiosInstance` para
  `AxiosCacheInstance` (superset → consumidores atuais continuam compilando). Sem nota de
  migração obrigatória.
- **Boundaries afetados:** **boundary 4** (dependência nova num template) — registrado aqui.
  Edge-safety preservada (storage memory, `typeof window`). Sem dado sensível. **Atenção
  server-side:** nunca compartilhar `storage` global no servidor (vazaria entre usuários) — o
  default per-instância evita isso.

## Emenda 2026-06-29 — geração de chave (`id`-prefixo) e invalidação por regex

> Extensão da decisão original (não a substitui). Acrescenta **como a chave de cache é gerada** e
> **como invalidar entradas em grupo**. O opt-in, o "só 2xx", a ordem do pipeline e o default
> per-instância continuam exatamente como acima.

### Contexto da emenda

A decisão original deixou a geração de chave no **default da lib** e a invalidação no `remove(id)`
nativo (apaga **uma** chave exata). Na prática, um projeto consumidor precisa invalidar um **grupo**
de entradas relacionadas após uma escrita (ex.: uma mutação em `/orders` deve derrubar a lista
cacheada **e** os itens já vistos). Com chaves opacas (hash puro) isso é inviável: não há como
mirar "todas as entradas de pedidos" sem guardar manualmente a lista de chaves.

### Decisão da emenda

1. **`generateKey` custom com `id` como prefixo** (`cache/key-generator.ts`, plugado em
   `setupCache({ generateKey })`). É um `KeyGenerator` **cru** (NÃO embrulhado em
   `buildKeyGenerator`): normaliza as barras de início/fim de `baseURL`/`url`, faz `hash` de
   `{ url, params, method, data }` (via `object-code`) e **prefixa o `id` da request** à hash —
   a chave é `` `${id ?? ''}${hash}` ``. Passar `{ id: 'orders' }` na chamada dá a um conjunto de
   requests um **prefixo de chave compartilhado e previsível** (`orders<hashA>`, `orders<hashB>`…),
   mantendo a unicidade por request via hash.
   - **Por que não o default (`buildKeyGenerator`):** ele **curto-circuita** quando `id` está setado
     (retorna o `id` puro, sem hash) — duas requests com o mesmo `id` colidiriam na mesma entrada.
     O gerador cru resolve isso somando `id` **+** hash, dando prefixo agrupável **sem** perder
     unicidade.
2. **`createMemoryCacheStorage` com `remove()` por regex** (`cache/storage.ts`). Embrulha o
   `buildMemoryStorage` (repassando `cloneData`, `cleanupInterval`, `maxEntries`, `maxStaleAge`) e
   **sobrescreve `remove(pattern)`** para tratar o argumento como **expressão regular** casada
   contra **todas** as chaves do store, apagando cada match — em vez de remover uma única chave
   exata. Casado com o `id`-prefixo, invalida um grupo inteiro numa chamada:
   `storage.remove('^orders')` após `client.post('/orders', …)`.

### Alternativas consideradas (emenda)

| Alternativa | Por que não |
|-------------|-------------|
| Manter `buildKeyGenerator` + `remove(id)` exato (default) | Curto-circuita no `id` (colisão) e só apaga 1 chave — impossível invalidar grupo por prefixo. |
| Índice/registro manual de chaves por "tag" | Mais bookkeeping e estado no template; o regex sobre as chaves já existentes resolve sem estrutura extra. |
| Helper público `invalidate(prefix)` | +1 export público no template; preferimos manter a superfície mínima e usar `storage.remove` nativo (override). |

### Consequências da emenda

- **Positivas:** invalidação em grupo por prefixo previsível; `generateKey`/`storage` isolados em
  `cache/` (testáveis sozinhos); superfície pública cresce só com `createMemoryCacheStorage` +
  tipo `CacheStorage` (já no `index.ts`).
- **Negativas / trade-offs / riscos:**
  - **Nova dependência direta `object-code` (^2.0.0)** — herdada por todos os consumidores
    (**boundary 4**). Mitigação: o próprio `axios-cache-interceptor` já a usa internamente, então é
    leve e alinhada; mesmo assim, **fica registrada aqui** como dep nova.
  - **Footgun do regex:** o argumento de `remove` é **regex, não id literal**. `remove('')` ou
    `'.*'` limpam o **store inteiro**; um `id` com metacaracteres (`.`, `*`, `(`, `[`…) casa como
    padrão. Documentado no README com ⚠️ (ancorar com `^`, escapar metacaracteres).
  - **Disponibilidade:** o `remove` por regex só existe em stores criados por
    `createMemoryCacheStorage`. O store **isolado default** (quando se omite `storage`) é
    `buildMemoryStorage` puro, com `remove` exato — e o consumidor nem tem handle dele.
- **Impacto no template:** **não-breaking** (apenas adições; assinaturas públicas existentes
  inalteradas).

### Critério de revisão da emenda

Rever se/quando: (a) adotarmos **storage persistente/externo** (Redis, IndexedDB) onde varrer
**todas** as chaves por regex a cada invalidação não escala — aí provavelmente migrar para
invalidação por **tags**/índice; ou (b) o footgun do regex causar incidente — aí considerar um
helper de invalidação que escapa/ancora por padrão.

## Follow-ups

- [ ] Quando o runner de testes for adotado (ver `patterns/testing.md` / futuro ADR de Vitest),
      cobrir: (a) sem param → não cacheia; (b) `{cache:{enabled:true}}` → 2ª chamada `cached:true`;
      (c) falha 4XX/5XX → **não** cacheada; (d) 401→refresh segue funcionando com cache ligado;
      (e) `generateKey` com `id` → chave = `id` + hash (mesmo `id`, URLs distintas → chaves
      distintas com prefixo comum); (f) `createMemoryCacheStorage().remove('^prefixo')` apaga
      **só** o grupo do prefixo (e `remove('')`/`'.*'` limpa tudo — guard de footgun).
      Validação atual foi por smoke test de runtime (opt-in + `testCachePredicate` 2xx).
- [ ] Atualizar `patterns/*.md` se surgir um pattern de "quando cachear" para os consumidores.
