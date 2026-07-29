# ADR-0010 — Achatar `core/` na raiz do http-client

- **Status:** Aceito
- **Data:** 2026-06-23
- **Decisores:** Lucas Ribeiro
- **Contexto técnico:** `src/api/http-client/` (estrutura de pastas)

> Atualiza a estrutura definida no **ADR-0002** (subpasta `core/`).

## Contexto

A subpasta `core/` do http-client (introduzida no ADR-0002) **colidia
conceitualmente** com a convenção `src/core/` que os projetos Next da Origami
adotam. Dois `core/` em contextos diferentes — um interno ao kit, outro do app —
geram confusão de leitura e navegação.

`core/` continha o client genérico (agnóstico de contrato e de framework):
`client.ts`, `factory.ts`, `request.ts`, `api-error.interceptor.ts`,
`ignored-errors.ts` (+ um `index.ts` barrel que ninguém importava).

## Decisão

**Achatar `core/` na raiz do pacote** e remover a pasta. O client genérico passa
a viver na raiz de `http-client/`, com as camadas-feature (`auth/`, `contracts/`,
`next/`) como subpastas sobre ele.

Racional: o client genérico **é** o pacote `http-client` — não é uma sub-área ao
lado das outras; é o núcleo do qual as features dependem. Logo, a raiz é seu lugar
natural (padrão de pacotes: `index` + núcleo na raiz, extensões em subpastas).
Elimina o nome "core" de vez — sem pasta e sem nome novo a inventar.

```
http-client/
├── index.ts                  # superfície pública
├── client.ts  factory.ts  request.ts  api-error.interceptor.ts  ignored-errors.ts
├── contracts/   auth/   next/
```

- `core/index.ts` (barrel) removido — não era importado por ninguém.
- Imports internos ajustados: dentro dos arquivos movidos `../auth|../contracts`
  → `./auth|./contracts`; nos externos `../core/x`/`./core/x` → `../x`/`./x`.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|-------------|------|---------|-------------|
| Achatar na raiz (escolhida) | Some o conceito "core"; menos um nível; raiz = núcleo do pacote (idiomático) | ~5 arquivos soltos na raiz junto das subpastas | — |
| Renomear `core/` → `engine/`/`base/`/`http/` | Mantém agrupamento | Ainda inventa um nome; mais um nível | Dev preferiu achatar |
| Manter `core/` | Zero esforço | A colisão com `src/core/` persiste | É o problema |

## Consequências

- **Positivas:** sem colisão com o `core/` dos projetos; navegação mais direta;
  a raiz comunica "o client é o pacote".
- **Negativas / trade-offs:** a raiz mistura arquivos do núcleo + subpastas de
  feature (aceitável e comum em pacotes).
- **Impacto no template:** **não-breaking para consumidores externos** — a API
  pública (`@/api/http-client`) e os subpaths (`/next`, `/next/server-client`)
  não mudaram; só caminhos **internos**.
- **Boundaries afetados:** nenhum.

## Follow-ups

- [ ] Os ADRs 0002–0009 citam paths `core/...` no texto/"Contexto técnico" — são
      registros históricos (válidos à época); não reescritos. Este ADR é a fonte
      de verdade da estrutura atual.
