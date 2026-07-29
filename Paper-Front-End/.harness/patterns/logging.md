# Pattern — Logging

> Como o Kami registra eventos. Sendo front-end + template, logging é **enxuto e
> seguro** — não há logger estruturado de servidor aqui.

## Regras (enforçadas pelo ESLint)

A config tem `no-console: ['warn', { allow: ['warn', 'error', 'info'] }]`:

- ❌ `console.log` / `console.debug` — **proibidos** (viram warning no lint).
- ✅ `console.info` — eventos informativos pontuais.
- ✅ `console.warn` — situação recuperável/inesperada mas tolerada.
- ✅ `console.error` — falha real que merece atenção.

## O que NUNCA logar

- Tokens, `Authorization`, `Cookie`, `Set-Cookie`, qualquer credencial.
- Corpo de request/response que possa conter dado pessoal do projeto consumidor.
- Em produção, evite logar payloads inteiros — logue o essencial (status, código
  de erro, endpoint).

## Feedback ao usuário ≠ log

No Kami, **erro visível ao usuário** é feito por **toast (`sonner`)**, não por
log. Ver `error.interceptor.ts`:

- O toast só dispara no **browser** (`isBrowser()`), nunca no servidor.
- Mensagens são **genéricas e em pt-BR** (`NETWORK_ERROR_MESSAGE`,
  `GENERIC_ERROR_MESSAGE`) ou a mensagem do envelope `failed`.
- `ignoredErrors` suprime o toast para casos esperados (ex.: 401 silencioso
  durante refresh usa `ignoredErrors: '*'`).

## Diretriz para projetos consumidores

Quando um projeto precisar de logging estruturado de servidor (correlação de
request, observabilidade), isso é **responsabilidade do projeto**, não do Kami —
a menos que vire um padrão de referência (então: ADR + novo pattern aqui).
Ver `patterns/monitoring.md`.
