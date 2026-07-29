# Pattern — Monitoramento / Observabilidade

> **Estado atual:** o Kami **não embute** ferramenta de monitoramento (sem APM,
> sem error tracking, sem analytics). É uma escolha deliberada: o template não
> impõe um vendor de observabilidade aos projetos consumidores.

## Princípio

Observabilidade é **decisão do projeto consumidor**, não do template. Acoplar o
Kami a um Sentry/Datadog/etc. forçaria a escolha sobre todos os projetos — isso
fere o boundary de generalidade. Ver `boundaries.md §1` e `§4`.

## Pontos de extensão já previstos (sem acoplar vendor)

O Kami expõe **hooks neutros** onde um projeto pode plugar observabilidade:

- **`onUnauthorized`** (`CreateApiClientOptions`) — ponto natural para registrar
  perda de sessão.
- **`error.interceptor`** — todo erro de API passa por aqui antes do toast. Um
  projeto pode envolver/estender para enviar a um error tracker — sem o Kami
  conhecer o vendor.
- **Type guards do envelope** — distinguem erro de negócio (`failed`) de erro de
  transporte (rede/HTTP), o que dá granularidade para métricas no consumidor.

## Se o Kami um dia adotar observabilidade

Só como **padrão de referência opt-in e agnóstico** (ex.: uma interface
`Reporter` que o projeto implementa). Requisitos:

- Interface neutra, vendor injetado pelo projeto (nunca hardcoded).
- Edge-safe quando aplicável.
- ADR registrando a decisão + novo conteúdo neste arquivo.

## Sinais que vale instrumentar (guia para o consumidor)

- Taxa de 401 → refresh → falha (sessões expirando cedo demais).
- Erros de rede (`ERR_NETWORK`) vs. erros de negócio (`failed`).
- Latência por endpoint.
