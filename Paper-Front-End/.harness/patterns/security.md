# Pattern — Segurança

> Como o Kami trata segurança. Por ser template, **este é o padrão que todos os
> projetos consumidores herdam** — então tem de ser seguro por construção.

## Autenticação e tokens

- **Tokens vivem em cookie httpOnly**, gerido pela API. O front nunca os lê nem
  os escreve em JS. Acesso via `withCredentials: true` (já default no client).
  → Nunca migre para `localStorage`/`sessionStorage` (boundary).
- **Refresh é transparente e single-flight.** Um 401 dispara `performRefresh`;
  401s concorrentes aguardam a mesma `refreshPromise`. A request original é
  reexecutada com a flag `retried` para impedir loop. Ver
  [auth.interceptor.ts](../../src/api/next-http-client/interceptors/auth.interceptor.ts).
- **Endpoints de auth não auto-refazem.** `isAuthEndpoint()` impede tentar
  refresh quando `/auth/login` ou `/auth/generate-access-token` falham — senão
  um login inválido entraria em loop.
- **JWT no front só lê `exp`.** `isAccessTokenLive` decodifica o payload **sem
  verificar assinatura** (a API faz isso). Edge-safe via `atob`. Nunca adicione
  verificação de assinatura no cliente.

## Falha de sessão

- Quando o refresh falha, o client chama `onUnauthorized?.()` — callback
  injetado pelo projeto (ex.: redirecionar para login). O Kami **não decide** o
  que fazer; ele só sinaliza. Mantenha assim (configurável, não hardcoded).

## Fronteira server/client

- Código que toca `cookies()` / `next/headers` fica em
  [server.ts](../../src/api/next-http-client/server.ts) e **nunca** é importado
  no cliente.
- Nada de segredo no bundle do navegador. Só `NEXT_PUBLIC_*` é exposto, e mesmo
  esses não carregam segredo.

## Dados em log e UI

- **Nunca** logar token, `Authorization`, `Cookie` ou `Set-Cookie`.
- Mensagens de erro ao usuário são genéricas e em pt-BR (sonner). Não vaze
  stack/detalhe interno da API para o toast.

## Input externo

- Toda resposta da API passa por type guards (`isApiResponse`,
  `isFailedResponse`) antes de ser tratada como confiável. Não confie no shape
  sem checar.

## Checklist rápido (segurança)

- [ ] Token nunca em storage de cliente nem em log
- [ ] `onUnauthorized` injetado, não hardcoded
- [ ] Código server-only não vaza para o cliente
- [ ] Resposta da API validada por type guard antes de usar
- [ ] Nenhum segredo no bundle do navegador
