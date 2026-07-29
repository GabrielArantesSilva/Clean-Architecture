# Módulo `server/http`

O servidor HTTP (Fastify) que **recebe use cases diretamente**: rotas são dados,
o container resolve o use case, o `UseCaseFactory` embrulha e o `applyUseCase`
adapta request/resposta ao envelope `{ process, body }`. O mecanismo genérico
(registerRoutes/applyUseCase/IRoute) mora no kit **`framework/http/`** (ADR-025);
aqui fica a composição DESTE app — incluindo os middlewares.

`server/` acomoda mais tipos de server no futuro — um `server/queue/` (BullMQ)
sobe ao lado, reusando o mesmo container e os mesmos use cases (o `UseCaseFactory`
é transport-agnóstico). Hoje só o HTTP existe.

## Layout

```
server/
  index.ts                  entrypoint: bootstrap() + lista de IServer + start + graceful shutdown
  types.ts                  IServer { start, stop } — contrato comum dos servers
  shutdown.ts               gracefulShutdown(servers) em SIGTERM/SIGINT
  http/
    app.ts                  classe HttpServer (padrão tecnoflow): constructor monta o
                            Fastify (plugins -> middlewares -> rotas -> error handler)
    error-handler.ts        traduz HttpException/500 -> { process, body } (único lugar)
    middlewares/
      authenticate.ts       plugin global: hook onRoute lê config.authMethod e liga o
                            auth por cookie de sessão (verifica + carrega o user do banco)
      validate-access.ts    plugin global: hook onRoute lê config.requiredPermissions

framework/http/             (kit — copia intacto; ver framework/README.md)
  routes.ts                 registerRoutes(IRoute[], { group }) -> fastify.route() + config
  apply-use-case.ts         monta data (query+body+params+userId), chama handle, responde
  types.ts                  IRoute, HandlerOptions, AuthenticationMethods, augments
                            (request.user e FastifyContextConfig)

config/
  bootstrap.ts              composition root de DI (tsyringe) — liga Symbol -> impl
```

## Rota como dado (shape tecnoflow)

```ts
// modules/users/users.routes.ts — rota sem auth_method é pública
export const usersRoutes: readonly IRoute[] = [
  { method: 'post', path: '',    use_case_class: CreateUserUseCase },
  { method: 'get',  path: '',    use_case_class: ListUsersUseCase,  auth_method: 'jwt' },
  { method: 'get',  path: '/me', use_case_class: GetUserByIdUseCase, auth_method: 'jwt' },
]
// HttpServer.addRoutes(): this.app.register(registerRoutes(usersRoutes, { group: '/users' }))
```

O `registerRoutes` **não conhece middleware** — ele grava
`config: { authMethod, requiredPermissions }` em cada `fastify.route()`. Quem
liga os middlewares são os plugins globais via hook `onRoute` (mesmo desenho do
tecnoflow): `authenticate` PREPENDE o auth em `onRequest`; `validateAccess`
APENDA o checador de permissões (roda depois do auth).

`applyUseCase` monta o input do use case a partir de `query + body + params`, e —
em rota autenticada — injeta `userId` a partir do `request.user.id`.
`handler_options`: `separate_request_data` reempacota como `{ data, ... }`
(útil em PATCH); `map_params` transforma os path params.

## Auth por cookie de sessão

`authenticateJwt` (middlewares/authenticate.ts) lê o cookie de sessão, valida a
assinatura via porta `SessionVerifier` (fast-jwt HS256, resolvida do container —
`SessionVerifierSymbol` no bootstrap), **carrega o usuário do banco** (sessão de
quem não existe mais = 401, igual tecnoflow) e anexa
`request.user = { id, permissions }`. O front grava o cookie; o back só valida
(ADR-015/021). O domínio de exemplo não tem permissions — projetos reais
preenchem a lista a partir do usuário carregado, e o `validateAccess` passa a
valer nas rotas com `required_permissions`.

> **Login/refresh (set/unset de cookies):** o kami-backend é template e não tem
> um bounded context de autenticação, então não há um `applyAuthUseCase` aqui —
> seria código sem uso. Ao adicionar login num projeto real, crie um
> `apply-auth-use-case.ts` (e o fork por `manage_auth_cookies` no registerRoutes,
> como o tecnoflow) que, no sucesso, grava os cookies httpOnly
> `access_token`/`refresh_token` + a flag legível `is_authenticated`
> (`sameSite: 'strict'`, `secure` em produção) — o mesmo contrato que o
> http-client do kami-front-end espera em `/auth/login` e `/auth/generate-access-token`.

## Como adicionar um endpoint

1. Escreva o use case (ver `framework/use-case/README.md`).
2. Registre suas deps no `config/bootstrap.ts`.
3. Adicione uma linha ao `*.routes.ts` do módulo.
4. Se for um grupo novo, uma linha em `HttpServer.addRoutes()`:
   `this.app.register(registerRoutes(<grupo>Routes, { group: '/<grupo>' }))`.

### Erros comuns

| Sintoma | Causa provável |
|---|---|
| `Cannot resolve dependency` ao subir | Symbol não registrado no `bootstrap.ts` |
| Rota responde 404 | grupo não registrado no `HttpServer.addRoutes()` |
| Rota que devia ser protegida está pública | faltou `auth_method: 'jwt'` na rota |
| Body chega com shape errado num PATCH | faltou `handler_options.separate_request_data` |
| Erro vira 500 genérico em vez de 4xx | use case lançou `Error` em vez de subclasse de `HttpException` |
| Request inválida passa direto | validação não está no use case (`@ValidateWith`) |

## Gotchas

- O `onRoute` desliga o validador do Fastify (`validatorCompiler = () => () => true`)
  — validação é **só** no use case (ADR-021).
- `bootstrap()` roda **antes** de `new HttpServer()`: o constructor resolve o
  logger, os middlewares resolvem verifier/repository e o `registerRoutes`
  resolve os use cases do container.
- Um server novo (ex.: `server/queue/`) implementa `IServer` e entra na lista
  do `server/index.ts` — o graceful shutdown já o cobre.
